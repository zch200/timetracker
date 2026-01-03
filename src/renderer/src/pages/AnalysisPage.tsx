import React, { useEffect } from 'react';
import { StatsCards } from "@/components/analysis/StatsCards";
import { DimensionPieChart } from "@/components/analysis/DimensionPieChart";
import { TrendLineChart } from "@/components/analysis/TrendLineChart";
import { TimeDimensionTabs } from "@/components/analysis/TimeDimensionTabs";
import { useAnalysisStore } from "@/store/analysisStore";
import { getDateRangeByDimension, TimeDimension } from "@/utils/date";

export default function AnalysisPage() {
  const { 
    setDateRange, 
    dateRange,
    fetchTotalHours
  } = useAnalysisStore();

  const handleTimeDimensionChange = (dimension: TimeDimension) => {
    const { startDate, endDate } = getDateRangeByDimension(dimension);
    setDateRange(startDate, endDate);
  };

  useEffect(() => {
    // Initial load - week view
    const { startDate, endDate } = getDateRangeByDimension('week');
    setDateRange(startDate, endDate);
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchTotalHours({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      // Individual charts trigger their own data fetching based on store state (dateRange + dimension)
    }
  }, [dateRange, fetchTotalHours]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
        <TimeDimensionTabs onChange={handleTimeDimensionChange} />
      </div>
      
      <StatsCards />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DimensionPieChart />
        {/* Trend chart takes full width on mobile, half on desktop? 
            Wait, in TrendLineChart I set md:col-span-2. 
            Let's adjust layout grid. 
            Maybe Pie Chart on left (1 col), Ranking on right? 
            Trend Chart full width below?
        */}
      </div>
      
      <div className="grid grid-cols-1">
        <TrendLineChart />
      </div>
    </div>
  );
}
