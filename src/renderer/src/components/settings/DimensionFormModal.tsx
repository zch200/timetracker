import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DimensionWithOptions, DimensionOption } from '@/types/api-types'
import { useDimensionsStore } from '@/store/dimensionsStore'
import { toast } from 'react-hot-toast'

interface DimensionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'dimension' | 'option'
  initialData?: any
  dimensionId?: number // Required for creating option
  onSuccess?: () => void
}

const PRESET_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#64748b', // slate-500
]

export function DimensionFormModal({
  open,
  onOpenChange,
  type,
  initialData,
  dimensionId,
  onSuccess,
}: DimensionFormModalProps) {
  const { createDimension, updateDimension, createOption, updateOption } = useDimensionsStore()
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    order: 0
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          color: initialData.color || '#3b82f6',
          order: initialData.order || 0
        })
      } else {
        setFormData({
          name: '',
          color: '#3b82f6',
          order: 0
        })
      }
    }
  }, [open, initialData])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('名称不能为空')
      return
    }

    try {
      if (type === 'dimension') {
        if (initialData) {
          await updateDimension(initialData.id, { 
            name: formData.name, 
            order: formData.order 
          })
          toast.success('维度已更新')
        } else {
          await createDimension({ 
            name: formData.name, 
            order: formData.order 
          })
          toast.success('维度已创建')
        }
      } else {
        if (!dimensionId && !initialData) {
          toast.error('缺少维度ID')
          return
        }
        
        if (initialData) {
          await updateOption(initialData.id, {
            name: formData.name,
            color: formData.color,
            order: formData.order
          })
          toast.success('选项已更新')
        } else {
          await createOption(dimensionId!, {
            name: formData.name,
            color: formData.color,
            order: formData.order
          })
          toast.success('选项已创建')
        }
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('操作失败')
    }
  }

  const title = initialData 
    ? `编辑${type === 'dimension' ? '维度' : '选项'}`
    : `新建${type === 'dimension' ? '维度' : '选项'}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              名称
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          
          {type === 'option' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                颜色
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: formData.color }}
                      />
                      {formData.color}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border border-slate-200"
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">
              排序
            </Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

