import React, { useEffect } from 'react';
import { cn } from "@/lib/utils";

interface CircularTimerProps {
  elapsedSeconds: number;
  isRunning: boolean;
  onClick: () => void;
  className?: string;
}

export function CircularTimer({ elapsedSeconds, isRunning, onClick, className }: CircularTimerProps) {
  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG parameters
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Progress animation (just a visual effect, spinning 60s per loop or just filling up?)
  // Requirement says: "蓝色渐变动画顺时针填充". 
  // Let's make it fill up based on seconds (0-60) for a dynamic feel, or just a spinner.
  // The requirement mentions "Apple Watch activity ring" style. 
  // For a timer that grows indefinitely, usually we loop every minute or hour.
  // Let's loop every 60 seconds.
  const progress = (elapsedSeconds % 60) / 60;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div 
      className={cn("relative flex items-center justify-center cursor-pointer select-none group", className)}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Background Circle */}
      <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0" // slate-200
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={isRunning ? strokeDashoffset : circumference}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-linear",
            !isRunning && "stroke-slate-400"
          )}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
            <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400 */}
          </linearGradient>
        </defs>
      </svg>

      {/* Time Display */}
      <div className="text-center z-10">
        <div className={cn(
          "text-7xl font-bold tracking-tight font-mono tabular-nums transition-colors",
          isRunning ? "text-slate-900" : "text-slate-400"
        )}>
          {formatTime(elapsedSeconds)}
        </div>
        <div className="text-sm text-slate-400 font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isRunning ? "点击暂停" : "点击开始"}
        </div>
      </div>
    </div>
  );
}

