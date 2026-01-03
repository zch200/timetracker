import React, { useMemo } from 'react';
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
import { useCategoriesStore } from "@/store/categoriesStore";

export function TrendLineChart() {
  const { trendData } = useAnalysisStore();
  const { categories } = useCategoriesStore();

  const chartData = useMemo(() => {
    // Transform trendData: [{ date_group, category_name, total_hours }]
    // to Recharts format: [{ date, 'Work': 8, 'Life': 2 }]
    const groupedByDate: Record<string, any> = {};
    
    trendData.forEach(item => {
      if (!groupedByDate[item.date_group]) {
        groupedByDate[item.date_group] = { date: item.date_group };
      }
      groupedByDate[item.date_group][item.category_name] = item.total_hours;
    });

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">时间支出趋势</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            dy={10}
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
          {categories.map((cat) => (
            <Line
              key={cat.id}
              type="monotone"
              dataKey={cat.name}
              stroke={cat.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

