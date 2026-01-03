import React, { useEffect, useMemo } from 'react'
import { useTimeEntriesStore } from "@/store/timeEntriesStore"
import { TimeEntryListItem } from "./TimeEntryListItem"
import { Loader2 } from "lucide-react"
import { TimeEntryWithDimensions, Gap } from "@/types/api-types"
import { formatTime } from "@/utils/date"
import { formatDuration } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

type MergedItem = 
  | { type: 'entry', data: TimeEntryWithDimensions }
  | { type: 'gap', data: Gap }

export function TimeEntryList() {
  const { entries, gaps, selectedDate, isLoading, fetchByDate, deleteEntry, detectGaps } = useTimeEntriesStore()

  useEffect(() => {
    fetchByDate(selectedDate)
    detectGaps(selectedDate)
  }, [selectedDate, fetchByDate, detectGaps])

  const mergedItems = useMemo(() => {
    const items: MergedItem[] = []
    entries.forEach(e => items.push({ type: 'entry', data: e }))
    gaps.forEach(g => items.push({ type: 'gap', data: g }))
    
    // Sort by start_time DESC
    return items.sort((a, b) => {
        const tA = a.type === 'entry' ? a.data.start_time : a.data.start_time
        const tB = b.type === 'entry' ? b.data.start_time : b.data.start_time
        return new Date(tB).getTime() - new Date(tA).getTime()
    })
  }, [entries, gaps])

  const handleDelete = async (id: number) => {
    try {
        await deleteEntry(id)
        toast.success("已删除")
    } catch (error) {
        toast.error("删除失败")
    }
  }

  const handleEdit = (entry: TimeEntryWithDimensions) => {
      // TODO: Implement edit
      toast('编辑功能开发中', { icon: '🚧' })
  }

  const handleFillGap = (gap: Gap) => {
      // TODO: Implement fill gap
      toast('补录功能开发中', { icon: '🚧' })
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const totalSeconds = entries.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-6 md:px-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">
          记录明细 ({selectedDate})
        </h2>
        <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          总计 <span className="font-semibold text-slate-900">{totalHours}</span> 小时
        </div>
      </div>

      {mergedItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
          <p className="text-slate-400 text-sm">暂无记录，开始录入吧</p>
        </div>
      ) : (
        <div className="space-y-4 relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 -z-10" />
            {mergedItems.map((item) => {
                if (item.type === 'entry') {
                    return (
                        <TimeEntryListItem 
                            key={`entry-${item.data.id}`}
                            entry={item.data}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    )
                } else {
                    const gap = item.data
                    return (
                        <div 
                            key={`gap-${gap.start_time}`}
                            className="bg-red-50/50 border-2 border-red-200 border-dashed rounded-lg p-3 ml-8 flex items-center justify-between hover:bg-red-50 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                <span className="text-red-700 font-medium text-sm">
                                    🚫 空档: {formatTime(gap.start_time)} - {formatTime(gap.end_time)}
                                </span>
                                <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded-full w-fit">
                                    未记录 {formatDuration(gap.duration_seconds)}
                                </span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 h-8"
                                onClick={() => handleFillGap(gap)}
                            >
                                补录
                            </Button>
                        </div>
                    )
                }
            })}
        </div>
      )}
    </div>
  )
}
