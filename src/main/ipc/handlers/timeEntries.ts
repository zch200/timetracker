import { ipcMain } from 'electron'
import { getDatabase } from '../../database'
import { calculateDuration } from '../../utils/time'

// 获取某日记录列表
ipcMain.handle('timeEntries:getByDate', async (_event, date: string) => {
  try {
    const db = getDatabase()

    const entries = db
      .prepare(
        `
      SELECT
        te.id,
        te.activity,
        te.start_time,
        te.end_time,
        te.duration_minutes,
        te.date,
        c.id AS category_id,
        c.name AS category_name,
        c.color AS category_color
      FROM time_entries te
      INNER JOIN categories c ON te.category_id = c.id
      WHERE te.date = ?
      ORDER BY te.start_time DESC
    `
      )
      .all(date) as Array<{
      id: number
      activity: string
      start_time: string
      end_time: string
      duration_minutes: number
      date: string
      category_id: number
      category_name: string
      category_color: string
    }>

    return entries
  } catch (error: any) {
    return {
      error: error.message || '获取记录列表失败',
      code: 'DB_ERROR',
    }
  }
})

// 搜索历史事项（自动补全）
ipcMain.handle('activities:search', async (_event, keyword: string) => {
  try {
    const db = getDatabase()

    // 使用 LIKE 进行模糊匹配，按最近使用排序
    const activities = db
      .prepare(
        `
      SELECT DISTINCT activity
      FROM time_entries
      WHERE activity LIKE ? || '%'
      GROUP BY activity
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `
      )
      .all(keyword) as Array<{ activity: string }>

    return activities.map((item) => item.activity)
  } catch (error: any) {
    return {
      error: error.message || '搜索事项失败',
      code: 'DB_ERROR',
    }
  }
})

// 检测时间冲突
ipcMain.handle(
  'timeEntries:checkConflict',
  async (
    _event,
    params: {
      date: string
      startTime: string
      endTime: string
      excludeId?: number
    }
  ) => {
    try {
      const db = getDatabase()
      const { date, startTime, endTime, excludeId } = params

      let query = `
        SELECT id, activity, start_time, end_time
        FROM time_entries
        WHERE date = ?
          AND (
            (start_time < ? AND end_time > ?)
            OR (start_time < ? AND end_time > ?)
            OR (start_time >= ? AND start_time < ?)
            OR (end_time > ? AND end_time <= ?)
          )
      `

      const queryParams = [
        date,
        endTime,
        startTime,
        endTime,
        startTime,
        startTime,
        endTime,
        startTime,
        endTime,
      ]

      if (excludeId) {
        query += ' AND id != ?'
        queryParams.push(excludeId)
      }

      const conflicts = db.prepare(query).all(...queryParams) as Array<{
        id: number
        activity: string
        start_time: string
        end_time: string
      }>

      return conflicts
    } catch (error: any) {
      return {
        error: error.message || '检测时间冲突失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 创建时间段记录
ipcMain.handle(
  'timeEntries:create',
  async (
    _event,
    data: {
      categoryId: number
      activity: string
      startTime: string
      endTime: string
      date: string
      notes?: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { categoryId, activity, startTime, endTime, date, notes } = data

      // 计算时长（分钟）
      const durationMinutes = calculateDuration(startTime, endTime)

      if (durationMinutes <= 0) {
        return {
          error: '结束时间必须大于开始时间',
          code: 'INVALID_TIME_RANGE',
        }
      }

      if (durationMinutes > 1440) {
        return {
          error: '单次记录时长不能超过 24 小时',
          code: 'DURATION_TOO_LONG',
        }
      }

      // 插入记录
      const result = db
        .prepare(
          `
        INSERT INTO time_entries
          (category_id, activity, start_time, end_time, duration_minutes, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(categoryId, activity, startTime, endTime, durationMinutes, date, notes || null)

      return {
        success: true,
        id: Number(result.lastInsertRowid),
      }
    } catch (error: any) {
      return {
        error: error.message || '创建记录失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 更新时间段记录
ipcMain.handle(
  'timeEntries:update',
  async (
    _event,
    id: number,
    data: {
      categoryId: number
      activity: string
      startTime: string
      endTime: string
      notes?: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { categoryId, activity, startTime, endTime, notes } = data

      // 获取原记录的日期（更新时不改变日期）
      const existing = db
        .prepare('SELECT date FROM time_entries WHERE id = ?')
        .get(id) as { date: string } | undefined

      if (!existing) {
        return {
          error: '记录不存在',
          code: 'NOT_FOUND',
        }
      }

      // 计算时长（分钟）
      const durationMinutes = calculateDuration(startTime, endTime)

      if (durationMinutes <= 0) {
        return {
          error: '结束时间必须大于开始时间',
          code: 'INVALID_TIME_RANGE',
        }
      }

      if (durationMinutes > 1440) {
        return {
          error: '单次记录时长不能超过 24 小时',
          code: 'DURATION_TOO_LONG',
        }
      }

      // 更新记录
      db.prepare(
        `
        UPDATE time_entries
        SET category_id = ?,
            activity = ?,
            start_time = ?,
            end_time = ?,
            duration_minutes = ?,
            notes = ?
        WHERE id = ?
      `
      ).run(categoryId, activity, startTime, endTime, durationMinutes, notes || null, id)

      return { success: true }
    } catch (error: any) {
      return {
        error: error.message || '更新记录失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 删除时间段记录
ipcMain.handle('timeEntries:delete', async (_event, id: number) => {
  try {
    const db = getDatabase()

    // 检查记录是否存在
    const existing = db
      .prepare('SELECT id FROM time_entries WHERE id = ?')
      .get(id)

    if (!existing) {
      return {
        error: '记录不存在',
        code: 'NOT_FOUND',
      }
    }

    // 删除记录
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(id)

    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '删除记录失败',
      code: 'DB_ERROR',
    }
  }
})

// 按日期范围查询记录
ipcMain.handle(
  'timeEntries:getByDateRange',
  async (
    _event,
    params: {
      startDate: string
      endDate: string
      categoryIds?: number[]
      keyword?: string
      limit?: number
      offset?: number
    }
  ) => {
    try {
      const db = getDatabase()
      const {
        startDate,
        endDate,
        categoryIds,
        keyword,
        limit = 20,
        offset = 0,
      } = params

      // 构建查询条件
      const conditions: string[] = ['te.date BETWEEN ? AND ?']
      const queryParams: any[] = [startDate, endDate]

      if (categoryIds && categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => '?').join(',')
        conditions.push(`te.category_id IN (${placeholders})`)
        queryParams.push(...categoryIds)
      }

      if (keyword) {
        conditions.push('te.activity LIKE ?')
        queryParams.push(`%${keyword}%`)
      }

      const whereClause = conditions.join(' AND ')

      // 查询总数
      const totalResult = db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM time_entries te
        WHERE ${whereClause}
      `
        )
        .get(...queryParams) as { total: number }

      // 查询数据
      const entries = db
        .prepare(
          `
        SELECT
          te.id,
          te.activity,
          te.start_time,
          te.end_time,
          te.duration_minutes,
          te.date,
          c.id AS category_id,
          c.name AS category_name,
          c.color AS category_color
        FROM time_entries te
        INNER JOIN categories c ON te.category_id = c.id
        WHERE ${whereClause}
        ORDER BY te.date DESC, te.start_time DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(...queryParams, limit, offset) as Array<{
        id: number
        activity: string
        start_time: string
        end_time: string
        duration_minutes: number
        date: string
        category_id: number
        category_name: string
        category_color: string
      }>

      return {
        data: entries,
        total: totalResult.total,
      }
    } catch (error: any) {
      return {
        error: error.message || '查询记录失败',
        code: 'DB_ERROR',
      }
    }
  }
)

