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

export interface EntryAttribute {
  id: number
  entry_id: number
  option_id: number
  created_at: string
}

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
