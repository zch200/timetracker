import React, { useEffect, useState } from 'react';
import { useAnalysisStore } from "@/store/analysisStore";
import { useCategoriesStore } from "@/store/categoriesStore";
import { TimeDimensionTabs } from "@/components/analysis/TimeDimensionTabs";
import { StatsCards } from "@/components/analysis/StatsCards";
import { TrendLineChart } from "@/components/analysis/TrendLineChart";
import { CategoryPieChart } from "@/components/analysis/CategoryPieChart";
import { TimeDimension, getDateRangeByDimension } from "@/utils/date";

export default function AnalysisPage() {
  const [dimension, setDimension] = useState<TimeDimension>('week');
  const { dateRange, setDateRange, fetchCategoryStats, fetchTrendData, fetchTotalHours } = useAnalysisStore();
  const { fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (dimension !== 'custom') {
      const range = getDateRangeByDimension(dimension);
      setDateRange(range.startDate, range.endDate);
    }
  }, [dimension, setDateRange]);

  useEffect(() => {
    const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };
    fetchCategoryStats(params);
    fetchTrendData({ ...params, groupBy: dimension === 'today' ? 'hour' : 'day' });
    fetchTotalHours(params);
  }, [dateRange, dimension, fetchCategoryStats, fetchTrendData, fetchTotalHours]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
        <TimeDimensionTabs value={dimension} onValueChange={setDimension} />
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <TrendLineChart />
        </div>
        <div>
          <CategoryPieChart />
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">更多分析功能</h3>
          <p className="text-slate-400 text-sm max-w-[250px]">
            事项排行榜、多维度对比功能正在开发中，敬请期待。
          </p>
        </div>
      </div>
    </div>
  );
}
