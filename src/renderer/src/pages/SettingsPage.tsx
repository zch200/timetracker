import React from 'react';
import { ExportDataPanel } from "@/components/settings/ExportDataPanel";
import { DimensionManagement } from "@/components/settings/DimensionManagement";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 pb-12">
      <h1 className="text-2xl font-bold text-slate-900">设置与数据管理</h1>

      <div className="space-y-12">
        <section>
          <DimensionManagement />
        </section>

        <div className="border-t pt-8">
          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-4">数据导出</h2>
            <ExportDataPanel />
          </section>
        </div>

        <section className="p-6 bg-slate-50 rounded-lg border border-dashed text-center">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">软件信息</h3>
          <p className="text-xs text-slate-400">
            TimeTracker v3.0.0 (Dev) <br />
            由 lok666 开发
          </p>
        </section>
      </div>
    </div>
  );
}
