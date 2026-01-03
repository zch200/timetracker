import React, { useEffect } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  selectedDate: string;
  onChange: (date: string) => void;
  className?: string;
}

export function DateNavigator({ selectedDate, onChange, className }: DateNavigatorProps) {
  const date = parseISO(selectedDate);
  const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDate;

  const handlePrev = () => {
    onChange(format(subDays(date, 1), 'yyyy-MM-dd'));
  };

  const handleNext = () => {
    onChange(format(addDays(date, 1), 'yyyy-MM-dd'));
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onChange(format(newDate, 'yyyy-MM-dd'));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      // Cmd+Left = Prev Day
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
      // Cmd+Right = Next Day
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      // Cmd+D = Today
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        onChange(format(new Date(), 'yyyy-MM-dd'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, onChange]);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-32 text-center">
          {format(date, 'yyyy-MM-dd', { locale: zhCN })}
          {isToday && <span className="ml-1 text-blue-500">(今日)</span>}
        </span>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNext} 
            className="h-8 w-8"
            disabled={isToday} // Disable future dates for MVP if desired, or just style
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
