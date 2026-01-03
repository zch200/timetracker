import { useEffect } from 'react';
import { useTimerStore } from "@/store/timerStore";

export function useGlobalShortcuts(
  onStopAndSave: () => void,
  onOpenManualEntry?: () => void
) {
  const { isRunning, isPaused, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      // Space: Start/Pause/Resume
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          pauseTimer();
        } else if (isPaused) {
          resumeTimer();
        } else {
          startTimer();
        }
      }

      // Enter: Stop and Save (only when paused or running)
      if (e.key === 'Enter') {
        if (isRunning || isPaused) {
          e.preventDefault();
          onStopAndSave();
        }
      }

      // Esc: Cancel Timer (only when running or paused)
      if (e.key === 'Escape') {
        if (isRunning || isPaused) {
          e.preventDefault();
          if (window.confirm('确定要取消当前计时吗？进度将丢失。')) {
             stopTimer();
          }
        }
      }

      // Cmd+N: Manual Entry (handled in global scope usually, but passed here)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onOpenManualEntry?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, startTimer, pauseTimer, resumeTimer, stopTimer, onStopAndSave, onOpenManualEntry]);
}

