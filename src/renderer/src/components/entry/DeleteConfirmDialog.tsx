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
import { TimeEntry } from "@/types/api-types";

interface DeleteConfirmDialogProps {
  entry: TimeEntry;
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
          <div className="font-mono text-slate-500">{entry.start_time} - {entry.end_time}</div>
          <div className="font-medium mt-1">{entry.activity}</div>
          <div className="text-xs text-slate-400 mt-1">{entry.category_name}</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button variant="destructive" onClick={onConfirm}>确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

