import type {
  Category,
  TimeEntry,
  CategoryStats,
  TrendDataPoint,
  ActivityRanking,
  CreateCategoryParams,
  UpdateCategoryParams,
  CreateTimeEntryParams,
  UpdateTimeEntryParams,
  CheckConflictParams,
  ConflictEntry,
  GetByDateRangeParams,
  ExportExcelParams,
  GetCategoryStatsParams,
  GetTrendDataParams,
  GetTotalHoursParams,
  GetActivityRankingParams,
  SuccessResponse,
  ExportExcelResult,
  ExportCancelled,
  ApiError,
} from '../types/api-types'

class TimeTrackerAPI {
  private async invoke(channel: string, ...args: any[]): Promise<any> {
    if (typeof window === 'undefined' || !window.electron) {
      console.warn(`Electron IPC not available for channel: ${channel}. Are you running in a web browser?`);
      return { error: 'Electron IPC not available', code: 'IPC_NOT_AVAILABLE' };
    }
    return window.electron.invoke(channel, ...args);
  }

  // 分类管理 API
  async getAllCategories(): Promise<Category[] | ApiError> {
    return this.invoke('categories:getAll')
  }

  async createCategory(
    params: CreateCategoryParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('categories:create', params)
  }

  async updateCategory(
    id: number,
    params: UpdateCategoryParams
  ): Promise<SuccessResponse | ApiError> {
    return this.invoke('categories:update', id, params)
  }

  async deleteCategory(id: number): Promise<SuccessResponse | ApiError> {
    return this.invoke('categories:delete', id)
  }

  // 时间段记录 API
  async getTimeEntriesByDate(date: string): Promise<TimeEntry[] | ApiError> {
    return this.invoke('timeEntries:getByDate', date)
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

  async checkTimeConflict(
    params: CheckConflictParams
  ): Promise<ConflictEntry[] | ApiError> {
    return this.invoke('timeEntries:checkConflict', params)
  }

  async getTimeEntriesByDateRange(
    params: GetByDateRangeParams
  ): Promise<{ data: TimeEntry[]; total: number } | ApiError> {
    return this.invoke('timeEntries:getByDateRange', params)
  }

  async searchActivities(keyword: string): Promise<string[] | ApiError> {
    return this.invoke('activities:search', keyword)
  }

  // 数据分析 API
  async getCategoryStats(
    params: GetCategoryStatsParams
  ): Promise<CategoryStats[] | ApiError> {
    return this.invoke('analysis:getCategoryStats', params)
  }

  async getTrendData(
    params: GetTrendDataParams
  ): Promise<TrendDataPoint[] | ApiError> {
    return this.invoke('analysis:getTrendData', params)
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

