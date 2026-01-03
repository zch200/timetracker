import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import {
  DimensionWithOptions,
  CreateDimensionParams,
  UpdateDimensionParams,
  CreateOptionParams,
  UpdateOptionParams,
} from '@/types/api-types'

interface DimensionsState {
  dimensions: DimensionWithOptions[]
  activeDimensions: DimensionWithOptions[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchDimensions: () => Promise<void>
  createDimension: (params: CreateDimensionParams) => Promise<void>
  updateDimension: (id: number, params: UpdateDimensionParams) => Promise<void>
  deleteDimension: (id: number) => Promise<void>
  toggleDimension: (id: number) => Promise<void>

  createOption: (dimensionId: number, params: CreateOptionParams) => Promise<void>
  updateOption: (id: number, params: UpdateOptionParams) => Promise<void>
  deleteOption: (id: number) => Promise<void>
}

export const useDimensionsStore = create<DimensionsState>()(
  persist(
    (set, get) => ({
      dimensions: [],
      activeDimensions: [],
      isLoading: false,
      error: null,

      fetchDimensions: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.getAllDimensions()
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            set({
              dimensions: result,
              activeDimensions: result.filter((d) => d.is_active),
              isLoading: false,
            })
          }
        } catch (error: any) {
          set({ error: error.message || '获取维度失败', isLoading: false })
        }
      },

      createDimension: async (params) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.createDimension(params)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '创建维度失败', isLoading: false })
        }
      },

      updateDimension: async (id, params) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.updateDimension(id, params)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '更新维度失败', isLoading: false })
        }
      },

      deleteDimension: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.deleteDimension(id)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '删除维度失败', isLoading: false })
        }
      },

      toggleDimension: async (id) => {
        set({ isLoading: true, error: null })
        try {
          // 找到当前状态取反
          const dim = get().dimensions.find((d) => d.id === id)
          if (!dim) return

          const result = await api.toggleDimension(id, !dim.is_active)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '切换维度状态失败', isLoading: false })
        }
      },

      createOption: async (dimensionId, params) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.createOption(dimensionId, params)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '创建选项失败', isLoading: false })
        }
      },

      updateOption: async (id, params) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.updateOption(id, params)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '更新选项失败', isLoading: false })
        }
      },

      deleteOption: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.deleteOption(id)
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            await get().fetchDimensions()
          }
        } catch (error: any) {
          set({ error: error.message || '删除选项失败', isLoading: false })
        }
      },
    }),
    {
      name: 'dimensions-storage',
      partialize: (state) => ({
        dimensions: state.dimensions,
        activeDimensions: state.activeDimensions,
      }), // 只持久化维度数据
    }
  )
)

