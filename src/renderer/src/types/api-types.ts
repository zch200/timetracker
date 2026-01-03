// API 类型定义

export interface Category {
  id: number
  name: string
  color: string
  sort_order: number
  is_active: number
  entry_count: number
}

export interface TimeEntry {
  id: number
  activity: string
  start_time: string
  end_time: string
  duration_minutes: number
  date: string
  category_id: number
  category_name: string
  category_color: string
}

export interface CategoryStats {
  id: number
  name: string
  color: string
  total_hours: number
  percentage: number
  entry_count: number
}

export interface TrendDataPoint {
  date_group: string
  category_id: number
  category_name: string
  color: string
  total_hours: number
}

export interface ActivityRanking {
  activity: string
  total_hours: number
  frequency: number
}

// API 请求参数类型
export interface CreateCategoryParams {
  name: string
  color: string
}

export interface UpdateCategoryParams {
  name?: string
  color?: string
}

export interface CreateTimeEntryParams {
  categoryId: number
  activity: string
  startTime: string
  endTime: string
  date: string
  notes?: string
}

export interface UpdateTimeEntryParams {
  categoryId: number
  activity: string
  startTime: string
  endTime: string
  notes?: string
}

export interface CheckConflictParams {
  date: string
  startTime: string
  endTime: string
  excludeId?: number
}

export interface ConflictEntry {
  id: number
  activity: string
  start_time: string
  end_time: string
}

export interface GetByDateRangeParams {
  startDate: string
  endDate: string
  categoryIds?: number[]
  keyword?: string
  limit?: number
  offset?: number
}

export interface ExportExcelParams {
  startDate?: string
  endDate?: string
  categoryIds?: number[]
}

export interface GetCategoryStatsParams {
  startDate: string
  endDate: string
}

export interface GetTrendDataParams {
  startDate: string
  endDate: string
  groupBy: 'day' | 'week'
}

export interface GetTotalHoursParams {
  startDate: string
  endDate: string
}

export interface GetActivityRankingParams {
  startDate: string
  endDate: string
  limit?: number
}

// API 响应类型
export interface ApiError {
  error: string
  code: string
}

export interface SuccessResponse {
  success: true
  id?: number
}

export interface ExportExcelResult {
  success: true
  filePath: string
  recordCount: number
}

export interface ExportCancelled {
  cancelled: true
}

