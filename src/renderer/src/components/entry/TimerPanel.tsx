import React, { useState } from 'react';
import { useTimerStore } from "@/store/timerStore";
import { useCategoriesStore } from "@/store/categoriesStore";
import { CircularTimer } from "./CircularTimer";
import { ActivityInput } from "./ActivityInput";
import { CategorySelect } from "./CategorySelect";
import { TimerControls } from "./TimerControls";
import { ConflictDialog } from "./ConflictDialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { format } from "date-fns";

import { useTimerTick } from "@/hooks/useTimerTick";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

interface TimerPanelProps {
  className?: string;
  onOpenManualEntry?: () => void;
}

export function TimerPanel({ className, onOpenManualEntry }: TimerPanelProps) {
  const { 
    isRunning, 
    isPaused, 
    elapsedSeconds, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer,
    updateDraft,
    clearTimer,
    draftActivity,
    draftCategoryId
  } = useTimerStore();

  useTimerTick();
  
  const { fetchByDate } = useTimeEntriesStore();
  
  const [conflictData, setConflictData] = useState<{
    conflicts: any[];
    pendingData: any;
  } | null>(null);

  // Handle stop and save logic
  const performSave = async (data: any = null) => {
    // If saving from conflict dialog, data is passed. 
    // If saving from normal flow, we construct data.
    const entryData = data || {
      activity: draftActivity,
      categoryId: draftCategoryId
    };
    
    // Construct time data if not passed
    let dateStr, startStr, endStr;
    if (data && data.date) {
        dateStr = data.date;
        startStr = data.startTime;
        endStr = data.endTime;
    } else {
        const now = new Date();
        endStr = format(now, 'HH:mm');
        const startMs = now.getTime() - elapsedSeconds * 1000;
        startStr = format(new Date(startMs), 'HH:mm');
        dateStr = format(now, 'yyyy-MM-dd');
    }

    try {
        await api.createTimeEntry({
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            activity: entryData.activity,
            categoryId: entryData.categoryId
        });
        
        toast.success("保存成功");
        stopTimer();
        clearTimer();
        fetchByDate(dateStr);
        setConflictData(null);
    } catch (error) {
        console.error(error);
        toast.error("保存失败");
    }
  };

  const handleStopCheck = async () => {
    if (!draftActivity.trim()) {
      toast.error("请输入事项名称");
      return;
    }
    if (!draftCategoryId) {
      toast.error("请选择分类");
      return;
    }

    try {
      const now = new Date();
      const endStr = format(now, 'HH:mm');
      const startMs = now.getTime() - elapsedSeconds * 1000;
      const startStr = format(new Date(startMs), 'HH:mm');
      const dateStr = format(now, 'yyyy-MM-dd');

      const conflicts = await api.checkTimeConflict({
        date: dateStr,
        startTime: startStr,
        endTime: endStr
      });

      if (conflicts.length > 0) {
        setConflictData({
          conflicts,
          pendingData: {
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            activity: draftActivity,
            categoryId: draftCategoryId
          }
        });
        return;
      }

      await performSave({
        date: dateStr,
        startTime: startStr,
        endTime: endStr,
        activity: draftActivity,
        categoryId: draftCategoryId
      });

    } catch (error) {
      console.error(error);
      toast.error("操作失败");
    }
  };

  // Enable shortcuts
  useGlobalShortcuts(handleStopCheck, onOpenManualEntry);

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 bg-slate-50/50 h-full", className)}>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm space-y-8">
        <CircularTimer
          elapsedSeconds={elapsedSeconds}
          isRunning={isRunning}
          onClick={isRunning ? pauseTimer : (isPaused ? resumeTimer : startTimer)}
        />

        <div className="w-full space-y-4">
          <ActivityInput 
            value={draftActivity}
            onChange={(val) => updateDraft('activity', val)}
          />
          
          <CategorySelect
            value={draftCategoryId ? String(draftCategoryId) : ''}
            onValueChange={(val) => updateDraft('categoryId', Number(val))}
          />
        </div>

        <TimerControls
          isRunning={isRunning}
          isPaused={isPaused}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={handleStopCheck}
        />
      </div>

      {conflictData && (
        <ConflictDialog 
          conflicts={conflictData.conflicts}
          onConfirm={() => performSave(conflictData.pendingData)}
          onCancel={() => setConflictData(null)}
        />
      )}
    </div>
  );
}
