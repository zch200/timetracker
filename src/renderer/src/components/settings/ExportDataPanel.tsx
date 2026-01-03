import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

export function ExportDataPanel() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Requirements mention scope selection, for MVP we do full export
      const result = await api.exportExcel({});
      
      if ('success' in result && result.success) {
        toast.success(`导出成功！共导出 ${result.recordCount} 条记录`);
      } else if ('cancelled' in result && result.cancelled) {
        // Do nothing
      } else if ('error' in result) {
        toast.error(result.error || "导出失败");
      }
    } catch (error: any) {
      toast.error("导出过程中发生错误");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          数据导出
        </CardTitle>
        <CardDescription>
          将您的所有时间记录导出为 Excel 文件，方便后续进行深度分析或备份。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Excel 格式 (.xlsx)</div>
              <div className="text-xs text-slate-500">包含所有字段：日期、时间、事项、分类、时长</div>
            </div>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 导出中...</>
            ) : (
              "立即导出"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

