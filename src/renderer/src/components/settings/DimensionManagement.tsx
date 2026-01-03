import React, { useEffect, useState } from 'react'
import { useDimensionsStore } from '@/store/dimensionsStore'
import { DimensionWithOptions, DimensionOption } from '@/types/api-types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, GripVertical, Settings2 } from 'lucide-react'
import { DimensionFormModal } from './DimensionFormModal'
import { toast } from 'react-hot-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function DimensionManagement() {
  const { 
    dimensions, 
    fetchDimensions, 
    toggleDimension, 
    deleteDimension,
    deleteOption
  } = useDimensionsStore()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'dimension' | 'option'>('dimension')
  const [editingData, setEditingData] = useState<any>(null)
  const [targetDimensionId, setTargetDimensionId] = useState<number | undefined>(undefined)

  useEffect(() => {
    fetchDimensions()
  }, [])

  const handleEditDimension = (dim: DimensionWithOptions) => {
    setModalType('dimension')
    setEditingData(dim)
    setTargetDimensionId(undefined)
    setEditModalOpen(true)
  }

  const handleCreateDimension = () => {
    setModalType('dimension')
    setEditingData(null)
    setTargetDimensionId(undefined)
    setEditModalOpen(true)
  }

  const handleCreateOption = (dimId: number) => {
    setModalType('option')
    setEditingData(null)
    setTargetDimensionId(dimId)
    setEditModalOpen(true)
  }

  const handleEditOption = (opt: DimensionOption, dimId: number) => {
    setModalType('option')
    setEditingData(opt)
    setTargetDimensionId(dimId)
    setEditModalOpen(true)
  }

  const handleDeleteDimension = async (id: number) => {
    if (confirm('确定要删除此维度吗？删除后相关历史数据可能会丢失标签。')) {
      await deleteDimension(id)
      toast.success('维度已删除')
    }
  }

  const handleDeleteOption = async (id: number) => {
    if (confirm('确定要删除此选项吗？')) {
      await deleteOption(id)
      toast.success('选项已删除')
    }
  }

  const handleToggleDimension = async (id: number) => {
    await toggleDimension(id)
    toast.success('状态已更新')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900">维度管理</h2>
          <p className="text-sm text-slate-500">配置需要追踪的分类维度（如项目、质量、领域等）</p>
        </div>
        <Button onClick={handleCreateDimension}>
          <Plus className="w-4 h-4 mr-2" />
          新建维度
        </Button>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim) => (
          <Card key={dim.id} className={dim.is_active ? '' : 'opacity-60 bg-slate-50'}>
            <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                <div>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {dim.name}
                    {!dim.is_active && <Badge variant="outline" className="text-xs">已禁用</Badge>}
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={!!dim.is_active} 
                    onCheckedChange={() => handleToggleDimension(dim.id)}
                  />
                  <span className="text-sm text-slate-500">启用</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <Button variant="ghost" size="icon" onClick={() => handleEditDimension(dim)}>
                  <Pencil className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteDimension(dim.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </CardHeader>
            
            {dim.is_active && (
              <CardContent className="pb-6 px-6 pt-0">
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="options" className="border-none">
                      <AccordionTrigger className="py-2 text-sm text-slate-500 hover:no-underline">
                        管理选项 ({dim.options.length})
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {dim.options.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between p-3 bg-white border rounded-lg group hover:border-blue-300 transition-colors">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                                <span className="text-sm font-medium truncate">{opt.name}</span>
                              </div>
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditOption(opt, dim.id)}>
                                  <Pencil className="w-3 h-3 text-slate-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteOption(opt.id)}>
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            className="h-auto py-3 border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                            onClick={() => handleCreateOption(dim.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            添加选项
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                 </Accordion>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <DimensionFormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        type={modalType}
        initialData={editingData}
        dimensionId={targetDimensionId}
        onSuccess={fetchDimensions}
      />
    </div>
  )
}

