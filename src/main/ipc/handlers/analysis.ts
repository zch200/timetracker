import { ipcMain } from 'electron'
import { getDatabase } from '../../database'

// 获取分类统计数据
ipcMain.handle(
  'analysis:getCategoryStats',
  async (
    _event,
    params: {
      startDate: string
      endDate: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { startDate, endDate } = params

      // 计算总时长（用于计算百分比）
      const totalResult = db
        .prepare(
          `
        SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM time_entries
        WHERE date BETWEEN ? AND ?
      `
        )
        .get(startDate, endDate) as { total_minutes: number }

      const totalMinutes = totalResult.total_minutes

      // 获取各分类统计
      const stats = db
        .prepare(
          `
        SELECT
          c.id,
          c.name,
          c.color,
          COALESCE(SUM(te.duration_minutes), 0) / 60.0 AS total_hours,
          COALESCE(
            CASE
              WHEN ? > 0 THEN (SUM(te.duration_minutes) * 100.0 / ?)
              ELSE 0
            END,
            0
          ) AS percentage,
          COUNT(te.id) AS entry_count
        FROM categories c
        LEFT JOIN time_entries te
          ON c.id = te.category_id
          AND te.date BETWEEN ? AND ?
        WHERE c.is_active = 1
        GROUP BY c.id, c.name, c.color
        ORDER BY total_hours DESC
      `
        )
        .all(
          totalMinutes,
          totalMinutes,
          startDate,
          endDate
        ) as Array<{
        id: number
        name: string
        color: string
        total_hours: number
        percentage: number
        entry_count: number
      }>

      return stats
    } catch (error: any) {
      return {
        error: error.message || '获取分类统计失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 获取趋势数据
ipcMain.handle(
  'analysis:getTrendData',
  async (
    _event,
    params: {
      startDate: string
      endDate: string
      groupBy: 'day' | 'week'
    }
  ) => {
    try {
      const db = getDatabase()
      const { startDate, endDate, groupBy } = params

      // 根据 groupBy 选择日期分组方式
      const dateGroupClause =
        groupBy === 'day'
          ? "te.date"
          : "strftime('%Y-W%W', te.date) || '-' || strftime('%w', te.date)"

      const trendData = db
        .prepare(
          `
        SELECT
          ${dateGroupClause} AS date_group,
          c.id AS category_id,
          c.name AS category_name,
          c.color,
          SUM(te.duration_minutes) / 60.0 AS total_hours
        FROM time_entries te
        INNER JOIN categories c ON te.category_id = c.id
        WHERE te.date BETWEEN ? AND ?
        GROUP BY date_group, c.id, c.name, c.color
        ORDER BY date_group ASC, c.sort_order ASC
      `
        )
        .all(startDate, endDate) as Array<{
        date_group: string
        category_id: number
        category_name: string
        color: string
        total_hours: number
      }>

      return trendData
    } catch (error: any) {
      return {
        error: error.message || '获取趋势数据失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 获取总用时
ipcMain.handle(
  'analysis:getTotalHours',
  async (
    _event,
    params: {
      startDate: string
      endDate: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { startDate, endDate } = params

      const result = db
        .prepare(
          `
        SELECT
          COALESCE(SUM(duration_minutes), 0) / 60.0 AS total_hours,
          COUNT(*) AS total_entries
        FROM time_entries
        WHERE date BETWEEN ? AND ?
      `
        )
        .get(startDate, endDate) as {
        total_hours: number
        total_entries: number
      }

      return {
        total_hours: result.total_hours,
        total_entries: result.total_entries,
      }
    } catch (error: any) {
      return {
        error: error.message || '获取总用时失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 获取事项时长排行
ipcMain.handle(
  'analysis:getActivityRanking',
  async (
    _event,
    params: {
      startDate: string
      endDate: string
      limit?: number
    }
  ) => {
    try {
      const db = getDatabase()
      const { startDate, endDate, limit = 10 } = params

      const ranking = db
        .prepare(
          `
        SELECT
          activity,
          SUM(duration_minutes) / 60.0 AS total_hours,
          COUNT(*) AS frequency
        FROM time_entries
        WHERE date BETWEEN ? AND ?
        GROUP BY activity
        ORDER BY total_hours DESC
        LIMIT ?
      `
        )
        .all(startDate, endDate, limit) as Array<{
        activity: string
        total_hours: number
        frequency: number
      }>

      return ranking
    } catch (error: any) {
      return {
        error: error.message || '获取事项排行失败',
        code: 'DB_ERROR',
      }
    }
  }
)

