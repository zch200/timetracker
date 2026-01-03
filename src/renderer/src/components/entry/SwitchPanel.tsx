import React from 'react'
import { CurrentActivityCard } from './CurrentActivityCard'
import { SwitchInput } from './SwitchInput'
import { DailyStatsCard } from './DailyStatsCard'

export function SwitchPanel() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <section className="space-y-4">
        <CurrentActivityCard />
      </section>
      
      <section className="py-4">
        <SwitchInput />
        <p className="text-center text-xs text-slate-400 mt-3">
          按 <kbd className="font-mono bg-slate-100 px-1 rounded border border-slate-200">Enter</kbd> 确认 · 
          按 <kbd className="font-mono bg-slate-100 px-1 rounded border border-slate-200">Cmd+K</kbd> 聚焦
        </p>
      </section>
      
      <section>
        <DailyStatsCard />
      </section>
    </div>
  )
}

