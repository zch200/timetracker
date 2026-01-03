import React, { useState } from 'react';
import { Pencil, Trash2 } from "lucide-react";
import { TimeEntry } from "@/types/api-types";
import { Button } from "@/components/ui/button";
import { TimeEntryForm } from "./TimeEntryForm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { cn } from "@/lib/utils";

interface TimeEntryListItemProps {
  entry: TimeEntry;
  onDelete: (id: number) => void;
}

export function TimeEntryListItem({ entry, onDelete }: TimeEntryListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isEditing) {
    return (
      <div className="border rounded-lg p-2 bg-slate-50 mb-2">
        <TimeEntryForm
          initialData={{
            id: entry.id,
            startTime: entry.start_time,
            endTime: entry.end_time,
            activity: entry.activity,
            categoryId: String(entry.category_id),
            date: entry.date,
          }}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const durationHours = (entry.duration_minutes / 60).toFixed(1);
  const durationDisplay = entry.duration_minutes >= 60 
    ? `${durationHours}h` 
    : `${entry.duration_minutes}m`;

  return (
    <div className="group p-3 hover:bg-slate-50 rounded-lg transition-colors border-b last:border-b-0 border-slate-100">
      {/* Row 1: Time | Dot | Activity */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-slate-400 font-mono w-24">
          {entry.start_time} - {entry.end_time}
        </span>
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: entry.category_color }}
        />
        <span className="font-semibold text-slate-900 truncate">
          {entry.activity}
        </span>
      </div>

      {/* Row 2: Category | Duration | Actions */}
      <div className="flex items-center justify-between pl-[112px]"> {/* 24(width) + 2(gap) + 8(dot) + 2(gap) + padding roughly */}
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{entry.category_name}</span>
          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 rounded text-xs">
            {durationDisplay}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 hover:text-blue-600"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 hover:text-red-600"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showDelete && (
        <DeleteConfirmDialog
          entry={entry}
          onConfirm={() => {
            onDelete(entry.id);
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
