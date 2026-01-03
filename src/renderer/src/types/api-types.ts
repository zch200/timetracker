// API 类型定义

// 维度相关
export interface Dimension {
  id: number
  name: string
  is_active: number
  order: number
  created_at: string
  updated_at: string
}

export interface DimensionOption {
  id: number
  dimension_id: number
  name: string
  color: string
  order: number
  created_at: string
  updated_at: string
}

export interface DimensionWithOptions extends Dimension {
  options: DimensionOption[]
}

// 时间记录相关
export interface TimeEntryWithDimensions {
  id: number
  title: string
  start_time: string
  end_time: string | null
  duration_seconds: number
  description?: string
  created_at: string
  updated_at: string
  dimensions: Array<{
    dimension_id: number
    dimension_name: string
    option_id: number
    option_name: string
    option_color: string
  }>
}

export interface Gap {
  start_time: string
  end_time: string
  duration_seconds: number
}

// 统计相关
export interface DimensionStats {
  option_id: number
  option_name: string
  color: string
  hours: number
  seconds: number
  percentage: number
  entry_count: number
}

export interface TrendDataPoint {
  date_group: string
  option_id: number
  option_name: string
  color: string
  hours: number
}

export interface ActivityRanking {
  activity: string
  total_hours: number
  frequency: number
}

// API 请求参数类型
// 维度管理
export interface CreateDimensionParams {
  name: string
  order?: number
}

export interface UpdateDimensionParams {
  name?: string
  order?: number
}

export interface CreateOptionParams {
  dimension_id: number
  name: string
  color: string
  order?: number
}

export interface UpdateOptionParams {
  name?: string
  color?: string
  order?: number
}

// 时间记录管理
export interface CreateTimeEntryParams {
  title: string
  startTime: string
  endTime: string
  optionIds: number[]
  description?: string
}

export interface SwitchActivityParams {
  title: string
  optionIds: number[]
  description?: string
}

export interface UpdateTimeEntryParams {
  title?: string
  startTime?: string
  endTime?: string | null
  optionIds?: number[]
  description?: string
}

export interface GetByDateRangeParams {
  startDate: string
  endDate: string
  keyword?: string
  limit?: number
  offset?: number
}

export interface ExportExcelParams {
  startDate?: string
  endDate?: string
}

// 分析参数
export interface GetDimensionStatsParams {
  dimensionId: number
  startDate: string
  endDate: string
}

export interface GetTrendDataParams {
  dimensionId: number
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
