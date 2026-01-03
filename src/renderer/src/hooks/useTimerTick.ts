import { useEffect } from 'react';
import { useTimerStore } from "@/store/timerStore";

export function useTimerTick() {
  const { 
    isRunning, 
    isPaused, 
    startTime, 
    pausedTime, 
    setElapsedSeconds 
  } = useTimerStore();

  useEffect(() => {
    // Helper to calculate and set elapsed time
    const updateElapsed = () => {
      if (isRunning && startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      } else if (isPaused && startTime && pausedTime) {
        // If paused, elapsed is (pausedTime - startTime)
        // Note: startTime in store is already adjusted for previous pauses on resume,
        // so this simple subtraction works if we haven't resumed yet.
        // Wait, if we pause, we set isPaused=true and record pausedTime.
        // The elapsed time should be fixed at (pausedTime - startTime).
        const elapsed = Math.floor((pausedTime - startTime) / 1000);
        setElapsedSeconds(elapsed);
      } else {
         setElapsedSeconds(0);
      }
    };

    // Initial update on mount or state change
    updateElapsed();

    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(updateElapsed, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, startTime, pausedTime, setElapsedSeconds]);
}

