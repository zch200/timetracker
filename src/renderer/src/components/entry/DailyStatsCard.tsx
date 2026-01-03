import React from 'react';
import { cn } from "@/lib/utils";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { formatDuration } from "@/lib/utils";

interface DailyStatsCardProps {
  className?: string;
}

export function DailyStatsCard({ className }: DailyStatsCardProps) {
  const { entries } = useTimeEntriesStore();

  const totalSeconds = entries.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  
  // Format duration
  const hours = totalSeconds / 3600;
  let durationDisplay = '';
  if (hours >= 1) {
    durationDisplay = `${hours.toFixed(1)}h`;
  } else {
    durationDisplay = `${Math.floor(totalSeconds / 60)}m`;
  }

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-white rounded-lg border shadow-sm", className)}>
      <div className="flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span>今日总时长:</span>
          <span className="text-xl font-bold text-slate-900">{durationDisplay}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <span>记录数:</span>
          <span className="text-xl font-bold text-slate-900">{entries.length}</span>
          <span>条</span>
        </div>
      </div>
    </div>
  );
}
