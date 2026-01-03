import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  CategoryStats,
  TrendDataPoint,
  ActivityRanking,
  GetCategoryStatsParams,
  GetTrendDataParams,
  GetTotalHoursParams,
  GetActivityRankingParams,
} from '../types/api-types'

interface AnalysisState {
  categoryStats: CategoryStats[]
  trendData: TrendDataPoint[]
  totalHours: number
  totalEntries: number
  activityRanking: ActivityRanking[]
  isLoading: boolean
  error: string | null
  dateRange: { startDate: string; endDate: string }
  setDateRange: (startDate: string, endDate: string) => void
  fetchCategoryStats: (params: GetCategoryStatsParams) => Promise<void>
  fetchTrendData: (params: GetTrendDataParams) => Promise<void>
  fetchTotalHours: (params: GetTotalHoursParams) => Promise<void>
  fetchActivityRanking: (params: GetActivityRankingParams) => Promise<void>
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  categoryStats: [],
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

  setDateRange: (startDate: string, endDate: string) => {
    set({ dateRange: { startDate, endDate } })
  },

  fetchCategoryStats: async (params: GetCategoryStatsParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getCategoryStats(params)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ categoryStats: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取分类统计失败', isLoading: false })
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

