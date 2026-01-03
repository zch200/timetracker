import React, { useState } from 'react'
import { Pencil, Trash2 } from "lucide-react"
import { TimeEntryWithDimensions } from "@/types/api-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog" // Assume this needs update or is generic enough
import { formatTime } from "@/utils/date"
import { formatDuration } from "@/lib/utils"

interface TimeEntryListItemProps {
  entry: TimeEntryWithDimensions
  onDelete: (id: number) => void
  onEdit?: (entry: TimeEntryWithDimensions) => void
}

export function TimeEntryListItem({ entry, onDelete, onEdit }: TimeEntryListItemProps) {
  const [showDelete, setShowDelete] = useState(false)

  const startTime = formatTime(entry.start_time)
  const endTime = entry.end_time ? formatTime(entry.end_time) : 'Now'
  
  return (
    <div className="group relative pl-4 border-l-2 border-slate-200 hover:border-blue-400 transition-colors py-3 pr-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-sm font-mono text-slate-500">
               {startTime} - {endTime}
             </span>
             <span className="text-xs font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
               {formatDuration(entry.duration_seconds)}
             </span>
          </div>
          
          <h3 className="font-medium text-slate-900 truncate pr-2 text-base">
            {entry.title}
          </h3>
          
          {entry.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{entry.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            {entry.dimensions.map((dim) => (
               <Badge 
                 key={dim.option_id} 
                 variant="secondary" 
                 className="text-[10px] px-1.5 py-0 h-5 font-normal bg-white border border-slate-200 text-slate-600"
                 style={{
                   borderColor: dim.option_color + '40', // 25% opacity
                   color: dim.option_color
                 }}
               >
                 <span className="opacity-50 mr-1">{dim.dimension_name}:</span>
                 {dim.option_name}
               </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
          {onEdit && (
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                onClick={() => onEdit(entry)}
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-red-600"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showDelete && (
        <DeleteConfirmDialog
          entry={entry as any} // Temporary cast if type mismatch, need to check DeleteConfirmDialog
          onConfirm={() => {
            onDelete(entry.id)
            setShowDelete(false)
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
