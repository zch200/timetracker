import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface ActivityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function ActivityAutocomplete({ value, onChange }: ActivityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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

    const timer = setTimeout(search, 300); // Add debounce
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="relative w-full">
      <Input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)} // Delay close to allow click
        className="w-full"
        placeholder="输入事项..."
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-4 py-2 cursor-pointer hover:bg-slate-100 text-sm"
              onClick={() => {
                onChange(suggestion);
                setOpen(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
