import React, { useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDimensionsStore } from "@/store/dimensionsStore";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CategorySelect({ value, onValueChange }: CategorySelectProps) {
  const { dimensions, fetchDimensions } = useDimensionsStore();

  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  // Use "领域" dimension or the first active dimension as the "Category" replacement
  const targetDimension = useMemo(() => {
    return dimensions.find(d => d.name === '领域') || dimensions.find(d => d.is_active);
  }, [dimensions]);

  const options = targetDimension ? targetDimension.options : [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={targetDimension ? `选择${targetDimension.name}` : "选择分类"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={String(opt.id)}>
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: opt.color }}
              />
              <span>{opt.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
