import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/analysisStore";
import { Clock, ListTodo, PieChart } from "lucide-react";

export function StatsCards() {
  const { totalHours, totalEntries, dimensionStats } = useAnalysisStore();

  const mainStats = [
    {
      title: "总用时",
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "记录数",
      value: totalEntries,
      icon: ListTodo,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "当前维度分布",
      value: dimensionStats.length, // Number of active options in current view
      suffix: "项",
      icon: PieChart,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {mainStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.suffix && <span className="text-sm text-slate-500">{stat.suffix}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
