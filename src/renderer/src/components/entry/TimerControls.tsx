import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  className?: string;
}

export function TimerControls({ 
  isRunning, 
  isPaused, 
  onStart, 
  onPause, 
  onResume, 
  onStop,
  className 
}: TimerControlsProps) {
  
  if (!isRunning && !isPaused) {
    return (
      <Button 
        size="lg" 
        className={cn("w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200", className)}
        onClick={onStart}
      >
        <Play className="w-5 h-5 mr-2 fill-current" />
        开始计时
      </Button>
    );
  }

  if (isRunning) {
    return (
      <Button 
        size="lg" 
        variant="outline"
        className={cn("w-full h-12 text-lg font-medium border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800", className)}
        onClick={onPause}
      >
        <Pause className="w-5 h-5 mr-2 fill-current" />
        暂停
      </Button>
    );
  }

  // isPaused
  return (
    <div className={cn("flex gap-3 w-full", className)}>
      <Button 
        size="lg" 
        className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700"
        onClick={onResume}
      >
        <Play className="w-5 h-5 mr-2 fill-current" />
        继续
      </Button>
      <Button 
        size="lg" 
        variant="secondary"
        className="flex-1 h-12 text-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        onClick={onStop}
      >
        <Save className="w-5 h-5 mr-2" />
        结束
      </Button>
    </div>
  );
}

