import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  TrendDataPoint,
  ActivityRanking,
  GetTrendDataParams,
  GetTotalHoursParams,
  GetActivityRankingParams,
  DimensionStats,
  GetDimensionStatsParams,
} from '../types/api-types'

interface AnalysisState {
  dimensionStats: DimensionStats[]
  trendData: TrendDataPoint[]
  totalHours: number
  totalEntries: number
  activityRanking: ActivityRanking[]
  isLoading: boolean
  error: string | null
  dateRange: { startDate: string; endDate: string }
  selectedDimensionId: number | null
  
  setDateRange: (startDate: string, endDate: string) => void
  setSelectedDimensionId: (id: number) => void
  
  fetchDimensionStats: (params: GetDimensionStatsParams) => Promise<void>
  fetchTrendData: (params: GetTrendDataParams) => Promise<void>
  fetchTotalHours: (params: GetTotalHoursParams) => Promise<void>
  fetchActivityRanking: (params: GetActivityRankingParams) => Promise<void>
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  dimensionStats: [],
  trendData: [],
  totalHours: 0,
  totalEntries: 0,
  activityRanking: [],
  isLoading: false,
  error: null,
  dateRange: {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  selectedDimensionId: null,

  setDateRange: (startDate: string, endDate: string) => {
    set({ dateRange: { startDate, endDate } })
  },
  
  setSelectedDimensionId: (id: number) => {
    set({ selectedDimensionId: id })
  },

  fetchDimensionStats: async (params: GetDimensionStatsParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getDimensionStats(params)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ dimensionStats: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取维度统计失败', isLoading: false })
    }
  },

  fetchTrendData: async (params: GetTrendDataParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getTrendData(params)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ trendData: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取趋势数据失败', isLoading: false })
    }
  },

  fetchTotalHours: async (params: GetTotalHoursParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getTotalHours(params)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({
          totalHours: result.total_hours,
          totalEntries: result.total_entries,
          isLoading: false,
        })
      }
    } catch (error: any) {
      set({ error: error.message || '获取总用时失败', isLoading: false })
    }
  },

  fetchActivityRanking: async (params: GetActivityRankingParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getActivityRanking(params)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ activityRanking: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取事项排行失败', isLoading: false })
    }
  },
}))
