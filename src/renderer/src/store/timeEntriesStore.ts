import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  TimeEntryWithDimensions,
  CreateTimeEntryParams,
  UpdateTimeEntryParams,
  Gap,
} from '../types/api-types'
import { format } from 'date-fns'

interface TimeEntriesState {
  entries: TimeEntryWithDimensions[]
  currentActive: TimeEntryWithDimensions | null
  gaps: Gap[]
  selectedDate: string
  isLoading: boolean
  error: string | null

  // Actions
  setSelectedDate: (date: string) => void
  fetchByDate: (date: string) => Promise<void>
  getCurrentActive: () => Promise<void>
  detectGaps: (date: string) => Promise<void>
  
  switchActivity: (title: string, optionIds: number[], description?: string) => Promise<void>
  createEntry: (params: CreateTimeEntryParams) => Promise<void>
  updateEntry: (id: number, params: UpdateTimeEntryParams) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  
  getSmartDefaults: (title: string) => Promise<number[]>
}

export const useTimeEntriesStore = create<TimeEntriesState>((set, get) => ({
  entries: [],
  currentActive: null,
  gaps: [],
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  isLoading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date })
    // 切换日期时自动刷新数据
    get().fetchByDate(date)
    get().detectGaps(date)
  },

  fetchByDate: async (date: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getTimeEntriesByDate(date)
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ entries: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取记录列表失败', isLoading: false })
    }
  },

  getCurrentActive: async () => {
    try {
      const result = await api.getCurrentActive()
      if (result && 'error' in result) {
        // 忽略错误，只记录日志
        console.error(result.error)
      } else {
        set({ currentActive: result as TimeEntryWithDimensions | null })
      }
    } catch (error: any) {
      console.error('获取当前活动失败', error)
    }
  },

  detectGaps: async (date: string) => {
    try {
      const result = await api.detectGaps(date)
      if ('error' in result) {
        console.error(result.error)
      } else {
        set({ gaps: result })
      }
    } catch (error: any) {
      console.error('检测 Gaps 失败', error)
    }
  },

  switchActivity: async (title, optionIds, description) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.switchActivity({ title, optionIds, description })
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
        throw new Error(result.error)
      } else {
        // 刷新当前活动
        await get().getCurrentActive()
        
        // 刷新今日列表 (如果是今天)
        const today = format(new Date(), 'yyyy-MM-dd')
        if (get().selectedDate === today) {
          await get().fetchByDate(today)
          await get().detectGaps(today)
        }
        
        set({ isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '切换活动失败', isLoading: false })
      throw error
    }
  },

  createEntry: async (params: CreateTimeEntryParams) => {
    set({ error: null })
    try {
      const result = await api.createTimeEntry(params)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 刷新记录列表
        const entryDate = format(new Date(params.startTime), 'yyyy-MM-dd')
        if (entryDate === get().selectedDate) {
           await get().fetchByDate(entryDate)
           await get().detectGaps(entryDate)
        }
      }
    } catch (error: any) {
      set({ error: error.message || '创建记录失败' })
      throw error
    }
  },

  updateEntry: async (id: number, params: UpdateTimeEntryParams) => {
    set({ error: null })
    try {
      const result = await api.updateTimeEntry(id, params)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        await get().fetchByDate(get().selectedDate)
        await get().detectGaps(get().selectedDate)
        // 如果更新的是当前正在进行的活动，也刷新一下 active 状态
        if (get().currentActive?.id === id) {
          await get().getCurrentActive()
        }
      }
    } catch (error: any) {
      set({ error: error.message || '更新记录失败' })
      throw error
    }
  },

  deleteEntry: async (id: number) => {
    set({ error: null })
    try {
      const result = await api.deleteTimeEntry(id)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 从本地状态中移除该记录
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }))
        // 重新检测 gaps
        await get().detectGaps(get().selectedDate)
      }
    } catch (error: any) {
      set({ error: error.message || '删除记录失败' })
      throw error
    }
  },

  getSmartDefaults: async (title: string) => {
    try {
      const result = await api.getSmartDefaults(title)
      if ('error' in result) {
        return []
      }
      return result
    } catch (error) {
      return []
    }
  }
}))
