import React, { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useTimeEntriesStore } from "@/store/timeEntriesStore"
import { DimensionSelector } from "./DimensionSelector"
import { ArrowRight, Command } from "lucide-react"

export function SwitchInput() {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [pendingTitle, setPendingTitle] = useState('')
  const [smartDefaults, setSmartDefaults] = useState<number[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { getSmartDefaults, switchActivity, isLoading } = useTimeEntriesStore()

  // Global shortcut Cmd+K / Ctrl+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Autocomplete search
  useEffect(() => {
    const search = async () => {
      if (value.trim().length >= 1) {
        try {
          const res = await api.searchActivities(value)
          if (Array.isArray(res)) {
            setSuggestions(res)
            setShowSuggestions(true)
          }
        } catch (err) {
          console.error('Failed to search activities:', err)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [value])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!value.trim()) return

      // Trigger switch flow
      initiateSwitch(value.trim())
    }
  }

  const initiateSwitch = async (title: string) => {
    setPendingTitle(title)
    setShowSuggestions(false)
    
    // Get smart defaults
    const defaults = await getSmartDefaults(title)
    setSmartDefaults(defaults)
    
    setIsSelectorOpen(true)
  }

  const handleConfirmSwitch = async (optionIds: number[]) => {
    if (!pendingTitle) return
    
    try {
      await switchActivity(pendingTitle, optionIds)
      setValue('')
      setPendingTitle('')
    } catch (error) {
      console.error('Switch failed:', error)
      // Maybe show toast error
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center shadow-lg rounded-xl bg-white border border-slate-200 transition-shadow focus-within:shadow-xl focus-within:border-blue-400">
        <div className="pl-4 text-slate-400">
          <Command size={18} />
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="border-0 focus-visible:ring-0 text-lg py-6 shadow-none pl-3"
          placeholder="准备做什么？(Cmd+K)"
          autoFocus
        />
        <Button 
          size="icon" 
          variant="ghost" 
          className="mr-2 text-slate-400 hover:text-blue-600"
          onClick={() => value.trim() && initiateSwitch(value.trim())}
          disabled={!value.trim() || isLoading}
        >
          <ArrowRight size={20} />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              onClick={() => {
                setValue(suggestion)
                initiateSwitch(suggestion)
              }}
            >
              <span className="text-slate-400">🕒</span>
              {suggestion}
            </div>
          ))}
        </div>
      )}

      <DimensionSelector
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        onConfirm={handleConfirmSwitch}
        activityName={pendingTitle}
        initialSelection={smartDefaults}
      />
    </div>
  )
}

