import { create } from 'zustand'
import { api } from '../lib/api'
import type { Category, CreateCategoryParams, UpdateCategoryParams } from '../types/api-types'

interface CategoriesState {
  categories: Category[]
  isLoading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  createCategory: (params: CreateCategoryParams) => Promise<void>
  updateCategory: (id: number, params: UpdateCategoryParams) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.getAllCategories()
      if ('error' in result) {
        set({ error: result.error, isLoading: false })
      } else {
        set({ categories: result, isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || '获取分类列表失败', isLoading: false })
    }
  },

  createCategory: async (params: CreateCategoryParams) => {
    set({ error: null })
    try {
      const result = await api.createCategory(params)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 重新获取分类列表
        await get().fetchCategories()
      }
    } catch (error: any) {
      set({ error: error.message || '创建分类失败' })
      throw error
    }
  },

  updateCategory: async (id: number, params: UpdateCategoryParams) => {
    set({ error: null })
    try {
      const result = await api.updateCategory(id, params)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 重新获取分类列表
        await get().fetchCategories()
      }
    } catch (error: any) {
      set({ error: error.message || '更新分类失败' })
      throw error
    }
  },

  deleteCategory: async (id: number) => {
    set({ error: null })
    try {
      const result = await api.deleteCategory(id)
      if ('error' in result) {
        set({ error: result.error })
        throw new Error(result.error)
      } else {
        // 重新获取分类列表
        await get().fetchCategories()
      }
    } catch (error: any) {
      set({ error: error.message || '删除分类失败' })
      throw error
    }
  },
}))

