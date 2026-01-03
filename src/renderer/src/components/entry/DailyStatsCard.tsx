import React from 'react';
import { cn } from "@/lib/utils";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";

interface DailyStatsCardProps {
  className?: string;
}

export function DailyStatsCard({ className }: DailyStatsCardProps) {
  const { entries } = useTimeEntriesStore();

  const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  
  // Format duration
  // Duration >= 60min: X.Xh
  // Duration < 60min: XXm
  let durationDisplay = '';
  if (totalMinutes >= 60) {
    durationDisplay = `${(totalMinutes / 60).toFixed(1)}h`;
  } else {
    durationDisplay = `${Math.floor(totalMinutes)}m`;
  }

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-slate-50 border-b", className)}>
      <div className="flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span>总时长:</span>
          <span className="text-xl font-bold text-slate-900">{durationDisplay}</span>
        </div>
        <div className="w-px h-4 bg-slate-300" />
        <div className="flex items-center gap-2">
          <span>记录数:</span>
          <span className="text-xl font-bold text-slate-900">{entries.length}</span>
          <span>条</span>
        </div>
      </div>
    </div>
  );
}

