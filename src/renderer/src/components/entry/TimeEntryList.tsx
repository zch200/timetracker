import React, { useEffect } from 'react';
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { TimeEntryListItem } from "./TimeEntryListItem";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

export function TimeEntryList() {
  const { entries, selectedDate, isLoading, fetchByDate, deleteEntry } = useTimeEntriesStore();

  useEffect(() => {
    fetchByDate(selectedDate);
  }, [selectedDate, fetchByDate]);

  const handleDelete = async (id: number) => {
    try {
      // Requirements mention undo mechanism
      // For now let's do a simple delete with toast undo
      const entryToDelete = entries.find(e => e.id === id);
      if (!entryToDelete) return;

      await deleteEntry(id);
      
      toast((t) => (
        <span className="flex items-center gap-2">
          已删除 "{entryToDelete.activity}"
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-blue-600"
            onClick={async () => {
              await api.createTimeEntry({
                startTime: entryToDelete.start_time,
                endTime: entryToDelete.end_time,
                activity: entryToDelete.activity,
                categoryId: entryToDelete.category_id,
                date: entryToDelete.date
              });
              await fetchByDate(selectedDate);
              toast.dismiss(t.id);
              toast.success("已撤销");
            }}
          >
            撤销
          </Button>
        </span>
      ), { duration: 5000 });
    } catch (error: any) {
      toast.error("删除失败");
    }
  };

  const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-700">
          今日记录
        </h2>
        <div className="text-sm text-slate-500">
          总时长: <span className="font-semibold text-slate-900">{totalHours}</span> 小时
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
          <p className="text-slate-400 text-sm">暂无记录，开始录入吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <TimeEntryListItem 
              key={entry.id} 
              entry={entry} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";

