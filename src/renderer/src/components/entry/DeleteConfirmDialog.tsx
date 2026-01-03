import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeEntryWithDimensions } from "@/types/api-types";
import { formatTime } from "@/utils/date";

interface DeleteConfirmDialogProps {
  entry: TimeEntryWithDimensions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ entry, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除？</DialogTitle>
          <DialogDescription>
            此操作将永久删除以下记录：
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 bg-slate-50 rounded p-3 text-sm">
          <div className="font-mono text-slate-500">
            {formatTime(entry.start_time)} - {entry.end_time ? formatTime(entry.end_time) : 'Now'}
          </div>
          <div className="font-medium mt-1">{entry.title}</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {entry.dimensions.map(d => (
              <span key={d.option_id} className="text-xs text-slate-500 bg-white border border-slate-200 px-1 rounded">
                {d.dimension_name}:{d.option_name}
              </span>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button variant="destructive" onClick={onConfirm}>确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
