import { ipcMain } from 'electron'
import { getDatabase } from '../../database'
import { TimeEntryWithDimensions, Gap } from '../../database/types'

// 获取某日记录列表
ipcMain.handle('timeEntries:getByDate', async (_event, date: string) => {
  try {
    const db = getDatabase()

    // 1. 获取基础记录
    const entries = db
      .prepare(
        `
      SELECT
        te.id,
        te.title,
        te.start_time,
        te.end_time,
        te.duration_seconds,
        te.description,
        te.created_at,
        te.updated_at
      FROM time_entries te
      WHERE DATE(te.start_time) = ?
      ORDER BY te.start_time DESC
    `
      )
      .all(date) as any[]

    // 2. 获取每个记录的维度属性
    const result = entries.map((entry) => {
      const dimensions = db
        .prepare(
          `
        SELECT
          d.id AS dimension_id,
          d.name AS dimension_name,
          do.id AS option_id,
          do.name AS option_name,
          do.color AS option_color
        FROM entry_attributes ea
        JOIN dimension_options do ON ea.option_id = do.id
        JOIN dimensions d ON do.dimension_id = d.id
        WHERE ea.entry_id = ?
      `
        )
        .all(entry.id)

      return {
        ...entry,
        dimensions,
      }
    })

    return result
  } catch (error: any) {
    return {
      error: error.message || '获取记录列表失败',
      code: 'DB_ERROR',
    }
  }
})

// 获取正在进行的记录
ipcMain.handle('timeEntries:getCurrentActive', async () => {
  try {
    const db = getDatabase()
    const entry = db
      .prepare(
        `
      SELECT
        te.id,
        te.title,
        te.start_time,
        te.end_time,
        te.duration_seconds,
        te.description,
        te.created_at,
        te.updated_at
      FROM time_entries te
      WHERE te.end_time IS NULL
      LIMIT 1
    `
      )
      .get() as any

    if (!entry) return null

    const dimensions = db
      .prepare(
        `
      SELECT
        d.id AS dimension_id,
        d.name AS dimension_name,
        do.id AS option_id,
        do.name AS option_name,
        do.color AS option_color
      FROM entry_attributes ea
      JOIN dimension_options do ON ea.option_id = do.id
      JOIN dimensions d ON do.dimension_id = d.id
      WHERE ea.entry_id = ?
    `
      )
      .all(entry.id)

    return {
      ...entry,
      dimensions,
    }
  } catch (error: any) {
    return {
      error: error.message || '获取当前活动失败',
      code: 'DB_ERROR',
    }
  }
})

// 切换活动 (结束当前 + 开始新的)
ipcMain.handle(
  'timeEntries:switch',
  async (_event, params: { title: string; optionIds: number[]; description?: string }) => {
    const db = getDatabase()
    const { title, optionIds, description } = params

    const transaction = db.transaction(() => {
      // 1. 结束当前正在进行的记录
      db.prepare(
        `
        UPDATE time_entries
        SET
          end_time = datetime('now', 'localtime'),
          duration_seconds = CAST((julianday(datetime('now', 'localtime')) - julianday(start_time)) * 86400 AS INTEGER),
          updated_at = datetime('now', 'localtime')
        WHERE end_time IS NULL
      `
      ).run()

      // 2. 创建新记录
      const result = db
        .prepare(
          `
        INSERT INTO time_entries (title, start_time, end_time, duration_seconds, description)
        VALUES (?, datetime('now', 'localtime'), NULL, 0, ?)
      `
        )
        .run(title, description || null)

      const entryId = Number(result.lastInsertRowid)

      // 3. 关联维度选项
      const insertAttr = db.prepare(
        'INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)'
      )
      for (const optionId of optionIds) {
        insertAttr.run(entryId, optionId)
      }

      return entryId
    })

    try {
      const entryId = transaction()
      return { success: true, id: entryId }
    } catch (error: any) {
      return {
        error: error.message || '切换活动失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 创建时间记录 (补录)
ipcMain.handle(
  'timeEntries:create',
  async (
    _event,
    params: {
      title: string
      startTime: string
      endTime: string
      optionIds: number[]
      description?: string
    }
  ) => {
    const db = getDatabase()
    const { title, startTime, endTime, optionIds, description } = params

    const transaction = db.transaction(() => {
      // 1. 创建记录
      const result = db
        .prepare(
          `
        INSERT INTO time_entries (title, start_time, end_time, duration_seconds, description)
        VALUES (?, ?, ?, CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER), ?)
      `
        )
        .run(title, startTime, endTime, endTime, startTime, description || null)

      const entryId = Number(result.lastInsertRowid)

      // 2. 关联维度选项
      const insertAttr = db.prepare(
        'INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)'
      )
      for (const optionId of optionIds) {
        insertAttr.run(entryId, optionId)
      }

      return entryId
    })

    try {
      const entryId = transaction()
      return { success: true, id: entryId }
    } catch (error: any) {
      return {
        error: error.message || '创建记录失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 更新时间记录
ipcMain.handle(
  'timeEntries:update',
  async (
    _event,
    id: number,
    params: {
      title?: string
      startTime?: string
      endTime?: string | null
      optionIds?: number[]
      description?: string
    }
  ) => {
    const db = getDatabase()
    const { title, startTime, endTime, optionIds, description } = params

    const transaction = db.transaction(() => {
      // 1. 更新基础字段
      const updates: string[] = []
      const values: any[] = []

      if (title !== undefined) {
        updates.push('title = ?')
        values.push(title)
      }
      if (startTime !== undefined) {
        updates.push('start_time = ?')
        values.push(startTime)
      }
      if (endTime !== undefined) {
        updates.push('end_time = ?')
        values.push(endTime)
        // 如果结束时间更新了，重新计算时长
        if (endTime && (startTime || true)) {
          // 需要获取最新的 startTime
          const currentStartTime =
            startTime ||
            (db.prepare('SELECT start_time FROM time_entries WHERE id = ?').get(id) as any)
              .start_time
          updates.push('duration_seconds = CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)')
          values.push(endTime, currentStartTime)
        } else if (endTime === null) {
          updates.push('duration_seconds = 0')
        }
      }
      if (description !== undefined) {
        updates.push('description = ?')
        values.push(description)
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now', 'localtime')")
        values.push(id)
        db.prepare(`UPDATE time_entries SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }

      // 2. 更新维度属性 (先删后插)
      if (optionIds !== undefined) {
        db.prepare('DELETE FROM entry_attributes WHERE entry_id = ?').run(id)
        const insertAttr = db.prepare(
          'INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)'
        )
        for (const optionId of optionIds) {
          insertAttr.run(id, optionId)
        }
      }

      return true
    })

    try {
      transaction()
      return { success: true }
    } catch (error: any) {
      return {
        error: error.message || '更新记录失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 删除时间记录
ipcMain.handle('timeEntries:delete', async (_event, id: number) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(id)
    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '删除记录失败',
      code: 'DB_ERROR',
    }
  }
})

// Gap 检测
ipcMain.handle('timeEntries:detectGaps', async (_event, date: string) => {
  try {
    const db = getDatabase()
    const gaps = db
      .prepare(
        `
      WITH ordered_entries AS (
        SELECT
          id,
          start_time,
          end_time,
          LEAD(start_time) OVER (ORDER BY start_time) AS next_start
        FROM time_entries
        WHERE DATE(start_time) = ?
      )
      SELECT
        end_time AS start_time,
        next_start AS end_time,
        CAST((julianday(next_start) - julianday(end_time)) * 86400 AS INTEGER) AS duration_seconds
      FROM ordered_entries
      WHERE next_start IS NOT NULL
        AND end_time IS NOT NULL
        AND end_time < next_start
    `
      )
      .all(date) as Gap[]

    return gaps
  } catch (error: any) {
    return {
      error: error.message || '检测 Gap 失败',
      code: 'DB_ERROR',
    }
  }
})

// 智能默认 (基于事项名称获取最近一次使用的维度选项)
ipcMain.handle('activities:getSmartDefaults', async (_event, title: string) => {
  try {
    const db = getDatabase()
    const lastEntry = db
      .prepare(
        `
      SELECT id
      FROM time_entries
      WHERE title = ?
      ORDER BY start_time DESC
      LIMIT 1
    `
      )
      .get(title) as { id: number } | undefined

    if (!lastEntry) return []

    const optionIds = db
      .prepare('SELECT option_id FROM entry_attributes WHERE entry_id = ?')
      .all(lastEntry.id) as Array<{ option_id: number }>

    return optionIds.map((item) => item.option_id)
  } catch (error: any) {
    return {
      error: error.message || '获取智能默认失败',
      code: 'DB_ERROR',
    }
  }
})

// 搜索历史事项（自动补全）
ipcMain.handle('activities:search', async (_event, keyword: string) => {
  try {
    const db = getDatabase()
    const activities = db
      .prepare(
        `
      SELECT DISTINCT title
      FROM time_entries
      WHERE title LIKE ? || '%'
      GROUP BY title
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `
      )
      .all(keyword) as Array<{ title: string }>

    return activities.map((item) => item.title)
  } catch (error: any) {
    return {
      error: error.message || '搜索事项失败',
      code: 'DB_ERROR',
    }
  }
})
