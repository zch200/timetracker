import React, { useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";

interface TimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (value: string) => void;
}

export function TimeInput({ value, onChangeValue, onBlur, ...props }: TimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+T or Ctrl+T for current time
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        if (document.activeElement === inputRef.current) {
          e.preventDefault();
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          onChangeValue(`${hours}:${minutes}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChangeValue]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Format 1430 -> 14:30
    if (/^\d{3,4}$/.test(val)) {
      const padded = val.padStart(4, '0');
      const formatted = `${padded.slice(0, 2)}:${padded.slice(2)}`;
      onChangeValue(formatted);
    }
    onBlur?.(e);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChangeValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="HH:MM"
      {...props}
    />
  );
}

