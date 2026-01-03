import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { TimeInput } from "./TimeInput";
import { CategorySelect } from "./CategorySelect";
import { ActivityAutocomplete } from "./ActivityAutocomplete";
import { TimeEntryFormValues, timeEntrySchema } from "@/schemas/timeEntry";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { api } from "@/lib/api";

interface TimeEntryFormProps {
  initialData?: Partial<TimeEntryFormValues> & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TimeEntryForm({ initialData, onSuccess, onCancel }: TimeEntryFormProps) {
  const { fetchByDate, detectGaps } = useTimeEntriesStore();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      startTime: initialData?.startTime ? initialData.startTime.split('T')[1]?.slice(0, 5) : '', // Handle full ISO string if passed
      endTime: initialData?.endTime ? initialData.endTime.split('T')[1]?.slice(0, 5) : '',
      activity: initialData?.activity || '',
      categoryId: initialData?.categoryId || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: TimeEntryFormValues) => {
    await saveData(data);
  };

  const saveData = async (data: TimeEntryFormValues) => {
    try {
      const fullStartTime = `${data.date}T${data.startTime}:00`;
      const fullEndTime = `${data.date}T${data.endTime}:00`;

      if (initialData?.id) {
        await api.updateTimeEntry(initialData.id, {
          title: data.activity,
          startTime: fullStartTime,
          endTime: fullEndTime,
          optionIds: [parseInt(data.categoryId)],
        });
        toast.success("更新成功");
      } else {
        await api.createTimeEntry({
          title: data.activity,
          startTime: fullStartTime,
          endTime: fullEndTime,
          optionIds: [parseInt(data.categoryId)],
        });
        toast.success("保存成功");
        reset();
      }
      
      await fetchByDate(data.date);
      await detectGaps(data.date);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">开始时间</label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TimeInput 
                value={field.value} 
                onChangeValue={field.onChange} 
                className={errors.startTime ? "border-red-500" : ""}
              />
            )}
          />
          {errors.startTime && <span className="text-xs text-red-500">{errors.startTime.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">结束时间</label>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TimeInput 
                value={field.value} 
                onChangeValue={field.onChange} 
                className={errors.endTime ? "border-red-500" : ""}
              />
            )}
          />
          {errors.endTime && <span className="text-xs text-red-500">{errors.endTime.message}</span>}
        </div>

        <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
          <label className="text-sm font-medium">事项</label>
          <Controller
            name="activity"
            control={control}
            render={({ field }) => (
              <ActivityAutocomplete 
                value={field.value} 
                onChange={field.onChange} 
              />
            )}
          />
          {errors.activity && <span className="text-xs text-red-500">{errors.activity.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">标签</label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategorySelect 
                value={field.value} 
                onValueChange={field.onChange} 
              />
            )}
          />
          {errors.categoryId && <span className="text-xs text-red-500">{errors.categoryId.message}</span>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {initialData?.id ? '更新' : '保存'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
