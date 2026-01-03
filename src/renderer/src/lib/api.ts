import type {
  DimensionWithOptions,
  TimeEntryWithDimensions,
  Gap,
  CreateDimensionParams,
  UpdateDimensionParams,
  CreateOptionParams,
  UpdateOptionParams,
  CreateTimeEntryParams,
  SwitchActivityParams,
  UpdateTimeEntryParams,
  GetByDateRangeParams,
  ExportExcelParams,
  GetTrendDataParams,
  TrendDataPoint,
  GetTotalHoursParams,
  GetActivityRankingParams,
  ActivityRanking,
  SuccessResponse,
  ExportExcelResult,
  ExportCancelled,
  ApiError,
  DimensionStats,
  GetDimensionStatsParams,
} from '../types/api-types'

class TimeTrackerAPI {
  private async invoke(channel: string, ...args: any[]): Promise<any> {
    if (typeof window === 'undefined' || !window.electron) {
      console.warn(
        `Electron IPC not available for channel: ${channel}. Are you running in a web browser?`
      )
      return { error: 'Electron IPC not available', code: 'IPC_NOT_AVAILABLE' }
    }
    return window.electron.invoke(channel, ...args)
  }

  // 维度管理 API
  async getAllDimensions(): Promise<DimensionWithOptions[] | ApiError> {
    return this.invoke('dimensions:getAll')
  }

  async createDimension(
    params: CreateDimensionParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('dimensions:create', params)
  }

  async updateDimension(
    id: number,
    params: UpdateDimensionParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('dimensions:update', id, params)
  }

  async deleteDimension(id: number): Promise<SuccessResponse | ApiError> {
    return this.invoke('dimensions:delete', id)
  }

  async toggleDimension(id: number, isActive: boolean): Promise<SuccessResponse | ApiError> {
    return this.invoke('dimensions:toggle', id, isActive)
  }

  async createOption(
    dimensionId: number,
    params: CreateOptionParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('options:create', { ...params, dimension_id: dimensionId })
  }

  async updateOption(
    id: number,
    params: UpdateOptionParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('options:update', id, params)
  }

  async deleteOption(id: number): Promise<SuccessResponse | ApiError> {
    return this.invoke('options:delete', id)
  }

  // 时间段记录 API
  async getTimeEntriesByDate(date: string): Promise<TimeEntryWithDimensions[] | ApiError> {
    return this.invoke('timeEntries:getByDate', date)
  }

  async getCurrentActive(): Promise<TimeEntryWithDimensions | null | ApiError> {
    return this.invoke('timeEntries:getCurrentActive')
  }

  async switchActivity(
    params: SwitchActivityParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('timeEntries:switch', params)
  }

  async detectGaps(date: string): Promise<Gap[] | ApiError> {
    return this.invoke('timeEntries:detectGaps', date)
  }

  async getSmartDefaults(title: string): Promise<number[] | ApiError> {
    return this.invoke('activities:getSmartDefaults', title)
  }

  async createTimeEntry(
    params: CreateTimeEntryParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('timeEntries:create', params)
  }

  async updateTimeEntry(
    id: number,
    params: UpdateTimeEntryParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('timeEntries:update', id, params)
  }

  async deleteTimeEntry(id: number): Promise<SuccessResponse | ApiError> {
    return this.invoke('timeEntries:delete', id)
  }

  async getTimeEntriesByDateRange(
    params: GetByDateRangeParams
  ): Promise<{ data: TimeEntryWithDimensions[]; total: number } | ApiError> {
    return this.invoke('timeEntries:getByDateRange', params)
  }

  async searchActivities(keyword: string): Promise<string[] | ApiError> {
    return this.invoke('activities:search', keyword)
  }

  // 数据分析 API
  async getDimensionStats(
    params: GetDimensionStatsParams
  ): Promise<DimensionStats[] | ApiError> {
    return this.invoke('analysis:statsByDimension', params)
  }

  async getTrendData(
    params: GetTrendDataParams
  ): Promise<TrendDataPoint[] | ApiError> {
    return this.invoke('analysis:trendByDimension', params)
  }

  async getTotalHours(
    params: GetTotalHoursParams
  ): Promise<{ total_hours: number; total_entries: number } | ApiError> {
    return this.invoke('analysis:getTotalHours', params)
  }

  async getActivityRanking(
    params: GetActivityRankingParams
  ): Promise<ActivityRanking[] | ApiError> {
    return this.invoke('analysis:getActivityRanking', params)
  }

  // 导出 API
  async exportExcel(
    params: ExportExcelParams
  ): Promise<ExportExcelResult | ExportCancelled | ApiError> {
    return this.invoke('export:excel', params)
  }
}

export const api = new TimeTrackerAPI()
export default api
