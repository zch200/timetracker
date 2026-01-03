import React, { useState } from 'react';
import { DateNavigator } from "./DateNavigator";
import { TimeEntryList } from "./TimeEntryList";
import { ManualEntryModal } from "./ManualEntryModal";
import { cn } from "@/lib/utils";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";

interface RecordsSidebarProps {
  className?: string;
  manualEntryOpen?: boolean;
  onManualEntryOpenChange?: (open: boolean) => void;
}

export function RecordsSidebar({ className, manualEntryOpen, onManualEntryOpenChange }: RecordsSidebarProps) {
  const { selectedDate, setSelectedDate } = useTimeEntriesStore();

  return (
    <div className={cn("flex flex-col h-full bg-white border-l shadow-sm z-10", className)}>
      <div className="p-4 border-b bg-white">
        <DateNavigator 
          selectedDate={selectedDate} 
          onChange={setSelectedDate} 
        />
      </div>
      
      {/* DailyStatsCard removed from here as it is in SwitchPanel now */}
      
      <div className="flex-1 overflow-y-auto p-0 bg-white">
        <TimeEntryList />
      </div>
      
      <div className="p-4 border-t bg-white">
        <ManualEntryModal 
          open={manualEntryOpen} 
          onOpenChange={onManualEntryOpenChange}
        />
      </div>
    </div>
  );
}
