import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoriesStore } from "@/store/categoriesStore";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CategorySelect({ value, onValueChange }: CategorySelectProps) {
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, categories.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we're in an input or textarea, don't trigger quick select unless it's specific
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        // However, we might want to allow it if the user is focused on the form
        // For MVP, let's keep it simple: 1, 2, 3 only if not in another text input
        // Actually, the requirement says "快捷键选择"，so we should probably listen for it
      }

      const key = parseInt(e.key);
      if (key >= 1 && key <= categories.length) {
        const category = categories[key - 1];
        if (category) {
          onValueChange(String(category.id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categories, onValueChange]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择分类" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category, index) => (
          <SelectItem key={category.id} value={String(category.id)}>
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">({index + 1})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

