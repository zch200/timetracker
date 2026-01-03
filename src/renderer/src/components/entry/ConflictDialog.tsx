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

interface ConflictDialogProps {
  conflicts: any[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConflictDialog({ conflicts, onConfirm, onCancel }: ConflictDialogProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <span>⚠️ 时间段冲突提醒</span>
          </DialogTitle>
          <DialogDescription>
            当前记录与以下记录时间重叠：
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          {conflicts.map((c) => (
            <div key={c.id} className="text-sm border-l-4 border-amber-500 pl-3 py-1 bg-amber-50">
              <span className="font-mono">{c.start_time}-{c.end_time}</span>
              <span className="ml-2 font-medium">{c.activity}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button variant="default" onClick={onConfirm}>仍然保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

