# TimeTracker IPC API 接口规范

## 文档说明

本文档定义 TimeTracker 应用中 **Electron 渲染进程（React）** 与 **主进程（Node.js）** 之间的 IPC（进程间通信）接口规范。

---

## 元信息

- **创建时间**：2026-01-02
- **最后更新**：2026-01-02
- **当前版本**：v1.0
- **通信协议**：Electron IPC（ipcMain.handle + ipcRenderer.invoke）

---

## 通信架构

### 调用方式

**渲染进程调用**：
```typescript
// 渲染进程（React 组件中）
const result = await window.electron.invoke('api:method', params);
```

**主进程处理**：
```typescript
// 主进程（main/ipc.ts）
ipcMain.handle('api:method', async (event, params) => {
  // 业务逻辑
  return result;
});
```

### 统一响应格式

**成功响应**：
```typescript
{
  success: true,
  data?: any,  // 可选，返回数据
}
```

**错误响应**：
```typescript
{
  error: string,  // 错误描述
  code: string,   // 错误代码
}
```

---

## API 分类

### 1. 分类管理 API
### 2. 时间段记录 API
### 3. 数据分析 API
### 4. 数据导入导出 API

---

## 1. 分类管理 API

### 1.1 获取所有分类

**API 名称**：`categories:getAll`

**描述**：获取所有启用的分类列表（含关联记录数）

**请求参数**：无

**响应数据**：
```typescript
interface Category {
  id: number;
  name: string;
  color: string;          // 十六进制色值，如 "#EF4444"
  sort_order: number;
  is_active: number;      // 1=启用 0=禁用
  entry_count: number;    // 关联的时间段记录数
}

// 返回数组
Category[]
```

**示例**：
```typescript
const categories = await window.electron.invoke('categories:getAll');
// [
//   { id: 1, name: '工作', color: '#EF4444', sort_order: 1, is_active: 1, entry_count: 120 },
//   { id: 2, name: '生活', color: '#10B981', sort_order: 2, is_active: 1, entry_count: 80 },
// ]
```

---

### 1.2 创建分类

**API 名称**：`categories:create`

**描述**：创建新的分类

**请求参数**：
```typescript
{
  name: string;    // 分类名称，最大 50 字符
  color: string;   // 十六进制色值
}
```

**响应数据**：
```typescript
// 成功
{
  success: true,
  id: number  // 新创建的分类 ID
}

// 失败（名称重复）
{
  error: '分类名称已存在',
  code: 'DUPLICATE_NAME'
}
```

**示例**：
```typescript
const result = await window.electron.invoke('categories:create', {
  name: '运动',
  color: '#F59E0B'
});
```

---

### 1.3 更新分类

**API 名称**：`categories:update`

**描述**：更新分类信息

**请求参数**：
```typescript
{
  id: number,      // 分类 ID
  name: string,    // 新名称
  color: string    // 新颜色
}
```

**响应数据**：
```typescript
// 成功
{ success: true }

// 失败（名称重复）
{
  error: '分类名称已存在',
  code: 'DUPLICATE_NAME'
}
```

**示例**：
```typescript
const result = await window.electron.invoke('categories:update', 1, {
  name: '工作（重要）',
  color: '#DC2626'
});
```

---

### 1.4 删除分类

**API 名称**：`categories:delete`

**描述**：删除分类（软删除）

**请求参数**：
```typescript
number  // 分类 ID
```

**响应数据**：
```typescript
// 成功
{ success: true }

// 失败（有关联记录）
{
  error: '该分类下有 120 条记录，无法删除',
  code: 'HAS_ENTRIES'
}

// 失败（最后一个分类）
{
  error: '至少需要保留一个分类',
  code: 'LAST_CATEGORY'
}
```

**示例**：
```typescript
const result = await window.electron.invoke('categories:delete', 3);
```

---

## 2. 时间段记录 API

### 2.1 获取某日记录列表

**API 名称**：`timeEntries:getByDate`

**描述**：获取指定日期的所有时间段记录

**请求参数**：
```typescript
string  // 日期，格式 YYYY-MM-DD
```

**响应数据**：
```typescript
interface TimeEntry {
  id: number;
  activity: string;
  start_time: string;        // HH:MM
  end_time: string;          // HH:MM
  duration_minutes: number;
  category_id: number;
  category_name: string;
  category_color: string;
}

// 返回数组（按 start_time 降序）
TimeEntry[]
```

**示例**：
```typescript
const entries = await window.electron.invoke('timeEntries:getByDate', '2026-01-02');
// [
//   {
//     id: 100,
//     activity: '写代码',
//     start_time: '14:00',
//     end_time: '16:00',
//     duration_minutes: 120,
//     category_id: 1,
//     category_name: '工作',
//     category_color: '#EF4444'
//   }
// ]
```

---

### 2.2 搜索历史事项（自动补全）

**API 名称**：`activities:search`

**描述**：根据关键词搜索历史事项（用于自动补全）

**请求参数**：
```typescript
string  // 搜索关键词
```

**响应数据**：
```typescript
// 返回字符串数组（最多 10 条，按最近使用排序）
string[]
```

**示例**：
```typescript
const suggestions = await window.electron.invoke('activities:search', '开');
// ['开会', '开发新功能', '开车']
```

---

### 2.3 检测时间冲突

**API 名称**：`timeEntries:checkConflict`

**描述**：检测指定时间段是否与已有记录冲突

**请求参数**：
```typescript
{
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  excludeId?: number;    // 可选，编辑时排除自身 ID
}
```

**响应数据**：
```typescript
// 返回冲突记录数组（无冲突则为空数组）
interface ConflictEntry {
  id: number;
  activity: string;
  start_time: string;
  end_time: string;
}

ConflictEntry[]
```

**示例**：
```typescript
const conflicts = await window.electron.invoke('timeEntries:checkConflict', {
  date: '2026-01-02',
  startTime: '14:30',
  endTime: '15:00'
});
// [{ id: 99, activity: '开会', start_time: '14:00', end_time: '15:00' }]
```

---

### 2.4 创建时间段记录

**API 名称**：`timeEntries:create`

**描述**：新增一条时间段记录

**请求参数**：
```typescript
{
  categoryId: number;
  activity: string;
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  date: string;          // YYYY-MM-DD
  notes?: string;        // 可选备注
}
```

**响应数据**：
```typescript
{
  success: true,
  id: number  // 新创建的记录 ID
}
```

**示例**：
```typescript
const result = await window.electron.invoke('timeEntries:create', {
  categoryId: 1,
  activity: '写代码',
  startTime: '14:00',
  endTime: '16:00',
  date: '2026-01-02'
});
```

---

### 2.5 更新时间段记录

**API 名称**：`timeEntries:update`

**描述**：更新已有记录

**请求参数**：
```typescript
{
  id: number,            // 记录 ID
  categoryId: number,
  activity: string,
  startTime: string,
  endTime: string,
  notes?: string
}
```

**响应数据**：
```typescript
{ success: true }
```

**示例**：
```typescript
const result = await window.electron.invoke('timeEntries:update', 100, {
  categoryId: 1,
  activity: '写代码（完成）',
  startTime: '14:00',
  endTime: '16:30'
});
```

---

### 2.6 删除时间段记录

**API 名称**：`timeEntries:delete`

**描述**：删除指定记录

**请求参数**：
```typescript
number  // 记录 ID
```

**响应数据**：
```typescript
{ success: true }
```

**示例**：
```typescript
await window.electron.invoke('timeEntries:delete', 100);
```

---

### 2.7 按日期范围查询记录

**API 名称**：`timeEntries:getByDateRange`

**描述**：查询指定日期范围的记录（支持分页）

**请求参数**：
```typescript
{
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  categoryIds?: number[];  // 可选，筛选分类
  keyword?: string;        // 可选，事项关键词
  limit?: number;          // 可选，每页条数（默认 20）
  offset?: number;         // 可选，偏移量（默认 0）
}
```

**响应数据**：
```typescript
{
  data: TimeEntry[],
  total: number  // 总记录数
}
```

**示例**：
```typescript
const result = await window.electron.invoke('timeEntries:getByDateRange', {
  startDate: '2025-12-01',
  endDate: '2026-01-02',
  categoryIds: [1, 2],
  limit: 20,
  offset: 0
});
```

---

## 3. 数据分析 API

### 3.1 获取分类统计数据

**API 名称**：`analysis:getCategoryStats`

**描述**：获取指定日期范围内各分类的统计数据

**请求参数**：
```typescript
{
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}
```

**响应数据**：
```typescript
interface CategoryStats {
  id: number;
  name: string;
  color: string;
  total_hours: number;      // 总时长（小时）
  percentage: number;       // 占比（百分比）
  entry_count: number;      // 记录条数
}

// 返回数组（按 total_hours 降序）
CategoryStats[]
```

**示例**：
```typescript
const stats = await window.electron.invoke('analysis:getCategoryStats', {
  startDate: '2026-01-01',
  endDate: '2026-01-07'
});
// [
//   { id: 1, name: '工作', color: '#EF4444', total_hours: 40, percentage: 50, entry_count: 50 }
// ]
```

---

### 3.2 获取趋势数据

**API 名称**：`analysis:getTrendData`

**描述**：获取时间趋势数据（按日或按周聚合）

**请求参数**：
```typescript
{
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week';  // 聚合粒度
}
```

**响应数据**：
```typescript
interface TrendDataPoint {
  date_group: string;      // '2026-01-02' 或 '2026-W01'
  category_id: number;
  category_name: string;
  color: string;
  total_hours: number;
}

// 返回数组
TrendDataPoint[]
```

**示例**：
```typescript
const trendData = await window.electron.invoke('analysis:getTrendData', {
  startDate: '2026-01-01',
  endDate: '2026-01-07',
  groupBy: 'day'
});
// [
//   { date_group: '2026-01-01', category_id: 1, category_name: '工作', color: '#EF4444', total_hours: 8 }
// ]
```

---

### 3.3 获取总用时

**API 名称**：`analysis:getTotalHours`

**描述**：获取指定日期范围的总用时和记录数

**请求参数**：
```typescript
{
  startDate: string;
  endDate: string;
}
```

**响应数据**：
```typescript
{
  total_hours: number;    // 总时长（小时）
  total_entries: number;  // 总记录数
}
```

**示例**：
```typescript
const total = await window.electron.invoke('analysis:getTotalHours', {
  startDate: '2026-01-01',
  endDate: '2026-01-07'
});
// { total_hours: 80, total_entries: 100 }
```

---

### 3.4 获取事项时长排行

**API 名称**：`analysis:getActivityRanking`

**描述**：获取事项时长排行（Top N）

**请求参数**：
```typescript
{
  startDate: string;
  endDate: string;
  limit?: number;  // 可选，默认 10
}
```

**响应数据**：
```typescript
interface ActivityRanking {
  activity: string;
  total_hours: number;
  frequency: number;  // 出现次数
}

// 返回数组（按 total_hours 降序）
ActivityRanking[]
```

**示例**：
```typescript
const ranking = await window.electron.invoke('analysis:getActivityRanking', {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  limit: 10
});
// [{ activity: '写代码', total_hours: 120, frequency: 60 }]
```

---

## 4. 数据导入导出 API

### 4.1 导出 Excel

**API 名称**：`export:excel`

**描述**：将时间段记录导出为 Excel 文件

**请求参数**：
```typescript
{
  startDate?: string;      // 可选，起始日期
  endDate?: string;        // 可选，结束日期
  categoryIds?: number[];  // 可选，筛选分类
}
```

**响应数据**：
```typescript
// 成功
{
  success: true,
  filePath: string,      // 保存的文件路径
  recordCount: number    // 导出的记录数
}

// 用户取消
{
  cancelled: true
}
```

**示例**：
```typescript
const result = await window.electron.invoke('export:excel', {
  startDate: '2019-01-01',
  endDate: '2026-01-02'
});
// { success: true, filePath: '/Users/lok666/Documents/TimeTracker_导出.xlsx', recordCount: 10000 }
```

---

### 4.2 导入 Excel（P1）

**API 名称**：`import:excel`

**描述**：从 Excel 文件导入时间段记录

**请求参数**：
```typescript
string  // Excel 文件路径
```

**响应数据**：
```typescript
// 成功
{
  success: true,
  successCount: number,   // 成功导入的记录数
  errorCount: number,     // 错误记录数
  errors: Array<{
    rowNumber: number,
    error: string,
    rawData: any[]
  }>
}

// 失败
{
  error: string,
  code: string
}
```

**示例**：
```typescript
const result = await window.electron.invoke('import:excel', '/path/to/timetable.xlsx');
// {
//   success: true,
//   successCount: 8500,
//   errorCount: 150,
//   errors: [{ rowNumber: 5, error: '结束时间小于开始时间', rawData: [...] }]
// }
```

---

## 5. 应用设置 API

### 5.1 获取应用信息

**API 名称**：`app:getInfo`

**描述**：获取应用版本、数据库路径等信息

**请求参数**：无

**响应数据**：
```typescript
{
  version: string,           // 应用版本号
  dbPath: string,            // 数据库文件路径
  platform: string,          // 操作系统平台
  electronVersion: string    // Electron 版本
}
```

**示例**：
```typescript
const info = await window.electron.invoke('app:getInfo');
// {
//   version: '1.0.0',
//   dbPath: '/Users/lok666/Library/Application Support/TimeTracker/timetracker.db',
//   platform: 'darwin',
//   electronVersion: '28.0.0'
// }
```

---

## 6. 错误代码说明

| 错误代码 | 说明 | 可能的原因 |
|---------|------|-----------|
| `DUPLICATE_NAME` | 名称重复 | 分类名称已存在 |
| `HAS_ENTRIES` | 有关联记录 | 删除分类时存在关联的时间段记录 |
| `LAST_CATEGORY` | 最后一个分类 | 尝试删除唯一的启用分类 |
| `INVALID_RANGE` | 无效范围 | 日期范围超过 1 年 |
| `DB_ERROR` | 数据库错误 | SQLite 查询或操作失败 |
| `FILE_ERROR` | 文件错误 | Excel 文件读写失败 |
| `NO_WORKSHEET` | 无工作表 | Excel 文件中未找到工作表 |

---

## 7. 前端 TypeScript 类型定义

### preload.d.ts
```typescript
// src/preload/preload.d.ts
export interface ElectronAPI {
  invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

### api-types.ts
```typescript
// src/renderer/types/api-types.ts

// ===== 分类相关 =====
export interface Category {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  is_active: number;
  entry_count: number;
}

export interface CreateCategoryParams {
  name: string;
  color: string;
}

export interface UpdateCategoryParams {
  name: string;
  color: string;
}

// ===== 时间段记录相关 =====
export interface TimeEntry {
  id: number;
  activity: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  category_id: number;
  category_name: string;
  category_color: string;
  date?: string;
  notes?: string;
}

export interface CreateTimeEntryParams {
  categoryId: number;
  activity: string;
  startTime: string;
  endTime: string;
  date: string;
  notes?: string;
}

export interface UpdateTimeEntryParams {
  categoryId: number;
  activity: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface CheckConflictParams {
  date: string;
  startTime: string;
  endTime: string;
  excludeId?: number;
}

export interface ConflictEntry {
  id: number;
  activity: string;
  start_time: string;
  end_time: string;
}

// ===== 分析相关 =====
export interface CategoryStats {
  id: number;
  name: string;
  color: string;
  total_hours: number;
  percentage: number;
  entry_count: number;
}

export interface TrendDataPoint {
  date_group: string;
  category_id: number;
  category_name: string;
  color: string;
  total_hours: number;
}

export interface ActivityRanking {
  activity: string;
  total_hours: number;
  frequency: number;
}

// ===== 导入导出相关 =====
export interface ExportParams {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
}

export interface ExportResult {
  success: true;
  filePath: string;
  recordCount: number;
}

export interface ImportResult {
  success: true;
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    error: string;
    rawData: any[];
  }>;
}

// ===== 通用响应 =====
export interface ErrorResponse {
  error: string;
  code: string;
}

export interface SuccessResponse {
  success: true;
  id?: number;
}
```

---

## 8. 使用示例

### 封装 API 调用（推荐）

```typescript
// src/renderer/lib/api.ts
import type {
  Category,
  CreateCategoryParams,
  TimeEntry,
  CreateTimeEntryParams,
  CategoryStats,
  ExportParams,
} from '@/types/api-types';

class TimeTrackerAPI {
  // ===== 分类管理 =====
  async getAllCategories(): Promise<Category[]> {
    return window.electron.invoke('categories:getAll');
  }

  async createCategory(params: CreateCategoryParams) {
    return window.electron.invoke('categories:create', params);
  }

  async updateCategory(id: number, params: UpdateCategoryParams) {
    return window.electron.invoke('categories:update', id, params);
  }

  async deleteCategory(id: number) {
    return window.electron.invoke('categories:delete', id);
  }

  // ===== 时间段记录 =====
  async getTimeEntriesByDate(date: string): Promise<TimeEntry[]> {
    return window.electron.invoke('timeEntries:getByDate', date);
  }

  async createTimeEntry(params: CreateTimeEntryParams) {
    return window.electron.invoke('timeEntries:create', params);
  }

  async updateTimeEntry(id: number, params: UpdateTimeEntryParams) {
    return window.electron.invoke('timeEntries:update', id, params);
  }

  async deleteTimeEntry(id: number) {
    return window.electron.invoke('timeEntries:delete', id);
  }

  async searchActivities(keyword: string): Promise<string[]> {
    return window.electron.invoke('activities:search', keyword);
  }

  async checkConflict(params: CheckConflictParams) {
    return window.electron.invoke('timeEntries:checkConflict', params);
  }

  // ===== 数据分析 =====
  async getCategoryStats(startDate: string, endDate: string): Promise<CategoryStats[]> {
    return window.electron.invoke('analysis:getCategoryStats', { startDate, endDate });
  }

  async getTrendData(startDate: string, endDate: string, groupBy: 'day' | 'week') {
    return window.electron.invoke('analysis:getTrendData', { startDate, endDate, groupBy });
  }

  // ===== 导入导出 =====
  async exportExcel(params: ExportParams) {
    return window.electron.invoke('export:excel', params);
  }

  async importExcel(filePath: string) {
    return window.electron.invoke('import:excel', filePath);
  }
}

export const api = new TimeTrackerAPI();
```

### 在 React 组件中使用

```typescript
// src/renderer/pages/EntryPage.tsx
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

export function EntryPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadTodayEntries();
  }, []);

  const loadTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = await api.getTimeEntriesByDate(today);
    setEntries(data);
  };

  const handleSubmit = async (formData) => {
    const result = await api.createTimeEntry(formData);
    if (result.success) {
      loadTodayEntries(); // 刷新列表
    }
  };

  // ...
}
```

---

## 9. 注意事项

1. **错误处理**：所有 API 调用应使用 try-catch 捕获异常
2. **类型安全**：使用 TypeScript 类型定义确保参数正确
3. **性能优化**：频繁调用的 API（如自动补全）应使用 debounce
4. **数据缓存**：分类列表等静态数据应缓存到 Zustand store
5. **并发控制**：避免同时发起大量 IPC 调用（可能导致性能问题）

---

**文档版本**：v1.0
**创建日期**：2026-01-02
**审核状态**：待用户确认
