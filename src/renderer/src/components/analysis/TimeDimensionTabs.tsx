import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeDimension } from "@/utils/date";

interface TimeDimensionTabsProps {
  value: TimeDimension;
  onValueChange: (value: TimeDimension) => void;
}

export function TimeDimensionTabs({ value, onValueChange }: TimeDimensionTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as TimeDimension)}>
      <TabsList className="grid w-full grid-cols-5 max-w-[500px]">
        <TabsTrigger value="today">今日</TabsTrigger>
        <TabsTrigger value="week">本周</TabsTrigger>
        <TabsTrigger value="month">本月</TabsTrigger>
        <TabsTrigger value="year">本年</TabsTrigger>
        <TabsTrigger value="custom">自定义</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

