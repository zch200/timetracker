import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAnalysisStore } from "@/store/analysisStore";

export function CategoryPieChart() {
  const { categoryStats } = useAnalysisStore();

  const data = categoryStats.map(stat => ({
    name: stat.name,
    value: stat.total_hours,
    color: stat.color,
    percentage: stat.percentage
  }));

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">分类时长占比</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
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
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

