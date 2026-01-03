import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  TimeEntry,
  CreateTimeEntryParams,
  UpdateTimeEntryParams,
  GetByDateRangeParams,
} from '../types/api-types'

interface TimeEntriesState {
  entries: TimeEntry[]
  selectedDate: string
  isLoading: boolean
  error: string | null
  fetchByDate: (date: string) => Promise<void>
  createEntry: (params: CreateTimeEntryParams) => Promise<void>
  updateEntry: (id: number, params: UpdateTimeEntryParams) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  setSelectedDate: (date: string) => void
}

export const useTimeEntriesStore = create<TimeEntriesState>((set, get) => ({
  entries: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date })
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

  createEntry: async (params: CreateTimeEntryParams) => {
    set({ error: null })
    try {
      const result = await api.createTimeEntry(params)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 重新获取当前日期的记录列表
        await get().fetchByDate(params.date)
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
        // 重新获取当前日期的记录列表
        await get().fetchByDate(get().selectedDate)
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
      }
    } catch (error: any) {
      set({ error: error.message || '删除记录失败' })
      throw error
    }
  },
}))

