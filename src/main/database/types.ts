// 数据库表类型定义

export interface Category {
  id: number
  name: string
  color: string
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: number
  category_id: number
  activity: string
  start_time: string
  end_time: string
  duration_minutes: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
}

