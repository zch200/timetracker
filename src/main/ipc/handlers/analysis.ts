import { ipcMain } from 'electron'
import { getDatabase } from '../../database'

// 获取按维度聚合的统计数据
ipcMain.handle(
  'analysis:statsByDimension',
  async (
    _event,
    params: {
      dimensionId: number
      startDate: string
      endDate: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { dimensionId, startDate, endDate } = params

      // 1. 计算总时长（该维度下的总时长，或者总时间范围内的总时长？通常是总时长以便计算占比）
      // 需求描述：SUM(te.duration_seconds) * 100.0 / (SELECT SUM(duration_seconds) FROM time_entries WHERE ... )
      const totalResult = db
        .prepare(
          `
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
      `
        )
        .get(startDate, endDate) as { total_seconds: number }

      const totalSeconds = totalResult.total_seconds

      // 2. 获取该维度下各选项的统计
      const stats = db
        .prepare(
          `
        SELECT
          do.id AS option_id,
          do.name AS option_name,
          do.color AS color,
          COALESCE(SUM(te.duration_seconds), 0) / 3600.0 AS hours,
          COALESCE(SUM(te.duration_seconds), 0) AS seconds,
          COALESCE(
            CASE
              WHEN ? > 0 THEN (SUM(te.duration_seconds) * 100.0 / ?)
              ELSE 0
            END,
            0
          ) AS percentage,
          COUNT(DISTINCT te.id) AS entry_count
        FROM dimension_options do
        LEFT JOIN entry_attributes ea ON do.id = ea.option_id
        LEFT JOIN time_entries te ON ea.entry_id = te.id AND DATE(te.start_time) BETWEEN ? AND ?
        WHERE do.dimension_id = ?
        GROUP BY do.id, do.name, do.color
        HAVING hours > 0
        ORDER BY hours DESC;
      `
        )
        .all(totalSeconds, totalSeconds, startDate, endDate, dimensionId) as Array<{
        option_id: number
        option_name: string
        color: string
        hours: number
        seconds: number
        percentage: number
        entry_count: number
      }>

      return stats
    } catch (error: any) {
      return {
        error: error.message || '获取维度统计失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 获取按维度选项的趋势数据
ipcMain.handle(
  'analysis:trendByDimension',
  async (
    _event,
    params: {
      dimensionId: number
      startDate: string
      endDate: string
      groupBy: 'day' | 'week'
    }
  ) => {
    try {
      const db = getDatabase()
      const { dimensionId, startDate, endDate, groupBy } = params

      const dateGroupClause =
        groupBy === 'day'
          ? "DATE(te.start_time)"
          : "strftime('%Y-W%W', te.start_time) || '-' || strftime('%w', te.start_time)"

      const trendData = db
        .prepare(
          `
        SELECT
          ${dateGroupClause} AS date_group,
          do.id AS option_id,
          do.name AS option_name,
          do.color,
          SUM(te.duration_seconds) / 3600.0 AS hours
        FROM time_entries te
        JOIN entry_attributes ea ON te.id = ea.entry_id
        JOIN dimension_options do ON ea.option_id = do.id
        WHERE do.dimension_id = ?
          AND DATE(te.start_time) BETWEEN ? AND ?
        GROUP BY date_group, do.id, do.name, do.color
        ORDER BY date_group ASC, hours DESC
      `
        )
        .all(dimensionId, startDate, endDate) as Array<{
        date_group: string
        option_id: number
        option_name: string
        color: string
        hours: number
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

// 获取总用时 (原有逻辑复用，只需确保表名正确)
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
          COALESCE(SUM(duration_seconds), 0) / 3600.0 AS total_hours,
          COUNT(*) AS total_entries
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
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

// 获取事项时长排行 (原有逻辑适配)
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
          title AS activity,
          SUM(duration_seconds) / 3600.0 AS total_hours,
          COUNT(*) AS frequency
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
        GROUP BY title
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
