import React, { useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAnalysisStore } from "@/store/analysisStore";
import { useDimensionsStore } from "@/store/dimensionsStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function DimensionPieChart() {
  const { 
    dimensionStats, 
    dateRange, 
    selectedDimensionId,
    setSelectedDimensionId,
    fetchDimensionStats 
  } = useAnalysisStore();
  const { dimensions, fetchDimensions } = useDimensionsStore();

  useEffect(() => {
    fetchDimensions();
  }, []);

  // Set initial dimension if none selected
  useEffect(() => {
    if (!selectedDimensionId && dimensions.length > 0) {
      // Prefer "领域" or first active
      const defaultDim = dimensions.find(d => d.name === '领域') || dimensions.find(d => d.is_active);
      if (defaultDim) {
        setSelectedDimensionId(defaultDim.id);
      }
    }
  }, [dimensions, selectedDimensionId]);

  useEffect(() => {
    if (selectedDimensionId && dateRange.startDate && dateRange.endDate) {
      fetchDimensionStats({
        dimensionId: selectedDimensionId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    }
  }, [selectedDimensionId, dateRange, fetchDimensionStats]);

  const data = dimensionStats.map(stat => ({
    name: stat.option_name,
    value: stat.hours,
    color: stat.color,
    percentage: stat.percentage
  }));

  return (
    <Card className="col-span-1 h-[450px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">时长占比</CardTitle>
        <Select
          value={selectedDimensionId?.toString()}
          onValueChange={(val) => setSelectedDimensionId(Number(val))}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="选择维度" />
          </SelectTrigger>
          <SelectContent>
            {dimensions.filter(d => d.is_active).map(dim => (
              <SelectItem key={dim.id} value={dim.id.toString()}>
                {dim.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[380px] p-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}h`, '时长']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

