import React, { useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAnalysisStore } from "@/store/analysisStore";
import { useDimensionsStore } from "@/store/dimensionsStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function TrendLineChart() {
  const { trendData, dateRange, selectedDimensionId, fetchTrendData } = useAnalysisStore();
  const { dimensions } = useDimensionsStore();

  useEffect(() => {
    if (selectedDimensionId && dateRange.startDate && dateRange.endDate) {
      fetchTrendData({
        dimensionId: selectedDimensionId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: 'day' // Default to day, can add toggle later
      });
    }
  }, [selectedDimensionId, dateRange, fetchTrendData]);

  // Get active dimension options to configure lines
  const currentDimensionOptions = useMemo(() => {
    const dim = dimensions.find(d => d.id === selectedDimensionId);
    return dim ? dim.options : [];
  }, [dimensions, selectedDimensionId]);

  const chartData = useMemo(() => {
    // Transform trendData: [{ date_group, option_name, hours }]
    const groupedByDate: Record<string, any> = {};
    
    trendData.forEach(item => {
      if (!groupedByDate[item.date_group]) {
        groupedByDate[item.date_group] = { date: item.date_group };
      }
      groupedByDate[item.date_group][item.option_name] = item.hours;
    });

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  return (
    <Card className="col-span-1 md:col-span-2 h-[450px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">时间趋势</CardTitle>
      </CardHeader>
      <CardContent className="h-[380px] p-4 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              label={{ value: '小时', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            {currentDimensionOptions.map((opt) => (
              <Line
                key={opt.id}
                type="monotone"
                dataKey={opt.name}
                stroke={opt.color}
                strokeWidth={2}
                dot={{ r: 3, fill: opt.color }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
