import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Command } from "lucide-react";

interface ActivityInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ActivityInput({ value, onChange, className, disabled }: ActivityInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut Cmd+I to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    const search = async () => {
      if (value.length >= 1) {
        try {
          const res = await api.searchActivities(value);
          if (active && Array.isArray(res)) {
            setSuggestions(res);
          }
        } catch (err) {
          console.error('Failed to search activities:', err);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(search, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Input 
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full pl-4 pr-10 py-6 text-lg"
          placeholder="今天在做什么..."
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Command className="h-4 w-4" />
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto py-1">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-4 py-2 cursor-pointer text-sm flex items-center gap-2",
                index === 0 ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
              )}
              onClick={() => {
                onChange(suggestion);
                setOpen(false);
              }}
            >
              {index === 0 && <span>🔍</span>}
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

