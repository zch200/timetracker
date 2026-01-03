import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerStore {
  // 计时器状态
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null; // 时间戳
  pausedTime: number | null; // 暂停时的累计时长（毫秒）或者暂停时刻的时间戳？
  // 按照计划文档：pausedTime: number | null
  // 实际上为了计算 elapsed，我们需要知道开始时间和总暂停时长，或者调整 startTime。
  // 简单起见，这里 pausedTime 记录暂停时刻的时间戳，用于计算暂停了多久。
  // 或者 elapsedSeconds 直接作为状态存储（不推荐，应该计算得出，但为了显示方便可能需要一个 tick 更新的值）
  elapsedSeconds: number;

  // 草稿数据
  draftActivity: string;
  draftCategoryId: number | null;

  // 操作方法
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  setElapsedSeconds: (seconds: number) => void;
  updateDraft: (field: 'activity' | 'categoryId', value: any) => void;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: null,
      elapsedSeconds: 0,
      draftActivity: '',
      draftCategoryId: null,

      startTimer: () => {
        set({ 
          isRunning: true, 
          isPaused: false, 
          startTime: Date.now(),
          pausedTime: null 
        });
      },

      pauseTimer: () => {
        set({ 
          isRunning: false, 
          isPaused: true,
          pausedTime: Date.now() // 记录暂停时刻
        });
      },

      resumeTimer: () => {
        const { startTime, pausedTime } = get();
        if (startTime && pausedTime) {
          // 调整 startTime，加上暂停的那段时间
          const pauseDuration = Date.now() - pausedTime;
          set({ 
            isRunning: true, 
            isPaused: false, 
            startTime: startTime + pauseDuration,
            pausedTime: null
          });
        }
      },

      stopTimer: () => {
        set({ 
          isRunning: false, 
          isPaused: false, 
          startTime: null, 
          pausedTime: null,
          elapsedSeconds: 0
        });
      },

      setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),

      updateDraft: (field, value) => {
        if (field === 'activity') set({ draftActivity: value });
        if (field === 'categoryId') set({ draftCategoryId: value });
      },

      clearTimer: () => {
        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pausedTime: null,
          elapsedSeconds: 0,
          draftActivity: '',
          draftCategoryId: null
        });
      }
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        // 只持久化草稿和状态，不持久化 elapsedSeconds（它应该重新计算）
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        startTime: state.startTime,
        pausedTime: state.pausedTime,
        draftActivity: state.draftActivity,
        draftCategoryId: state.draftCategoryId,
      }),
    }
  )
);

