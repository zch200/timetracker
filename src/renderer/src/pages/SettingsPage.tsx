import React from 'react';
import { ExportDataPanel } from "@/components/settings/ExportDataPanel";
import { CategoryManagement } from "@/components/settings/CategoryManagement";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">设置与数据管理</h1>

      <div className="space-y-6">
        <section>
          <CategoryManagement />
        </section>

        <section>
          <ExportDataPanel />
        </section>

        <section className="p-6 bg-slate-50 rounded-lg border border-dashed text-center">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">软件信息</h3>
          <p className="text-xs text-slate-400">
            TimeTracker v1.0.0 (MVP) <br />
            由 lok666 开发
          </p>
        </section>
      </div>
    </div>
  );
}
