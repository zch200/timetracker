# TimeTracker MVP 第一版开发计划

## 项目概述

TimeTracker 是一款 macOS 原生时间记录与分析工具，旨在替代 Excel 手工记录。项目目前处于**设计完成、代码未开始**阶段，需要从零开始搭建整个应用。

### 核心技术栈
- **前端**：Electron + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **状态管理**：Zustand
- **数据库**：better-sqlite3（同步 API）
- **图表**：Recharts
- **表单**：react-hook-form + zod
- **构建**：electron-vite

### 数据规模
- 现有历史数据：6.6 万条记录（2019-2025）
- 年增长：1.3 万条
- 性能目标：支持 10 年数据量（13 万条）

---

## 架构设计

### 三层架构

```
┌─────────────────────────────────────────────────┐
│              Electron App                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │   Renderer   │◄──IPC──►│     Main     │    │
│  │   (React)    │         │  (Node.js)   │    │
│  │              │         │              │    │
│  │ UI + Zustand │         │  Database    │    │
│  └──────────────┘         │  + Excel     │    │
│         ▲                 └──────┬───────┘    │
│         │                        │            │
│  ┌──────┴──────┐          ┌──────▼───────┐   │
│  │  Preload    │          │  SQLite DB   │   │
│  │  (Bridge)   │          │    File      │   │
│  └─────────────┘          └──────────────┘   │
└─────────────────────────────────────────────────┘
```

### 数据流设计

```
用户操作 → React 组件 → API 封装层 → window.electron.invoke()
    → Preload Script → IPC Handler → Database Service
    → SQLite → 返回数据 → Zustand Store → 组件重渲染
```

### 关键技术决策

| 技术点 | 方案 | 理由 |
|--------|------|------|
| 数据库 | better-sqlite3 | 同步 API 性能好，逻辑简单 |
| 状态管理 | Zustand | 轻量级，无需 Provider |
| UI 组件 | shadcn/ui | 可定制，Tailwind 生态 |
| 图表 | Recharts | React 原生，声明式 API |
| 表单校验 | zod | 类型安全，与 TypeScript 完美集成 |

---

## 开发阶段规划

### 阶段 1：基础设施层（3-4 天）✅ 已完成

**目标**：搭建项目骨架，确保开发环境正常运行

**完成日期**：2026-01-02

#### 1.1 项目初始化（0.5 天）✅

**核心任务**：
- 使用 `electron-vite` 脚手架创建项目
- 配置 TypeScript、ESLint、Prettier
- 配置 Tailwind CSS + PostCSS
- 配置路径别名（`@/` → `src/renderer`）

**关键文件**：
```
package.json              # 项目依赖配置
tsconfig.json             # TypeScript 配置
electron.vite.config.ts   # Vite 构建配置
tailwind.config.js        # Tailwind 样式配置
.eslintrc.cjs             # ESLint 规范
```

**验收标准**：
- `npm install` 无错误
- `npm run dev` 能启动 Electron 窗口
- 窗口显示基础页面，HMR 正常工作

---

#### 1.2 数据库基础设施（1 天）✅

**核心任务**：
- 实现 `Database` 类封装（单例模式）
- 执行 `schema.sql` 初始化表结构
- 配置 WAL 模式和外键约束
- 实现版本管理机制

**关键文件**：
```
src/main/database/
  ├── index.ts           # Database 类封装
  ├── schema.sql         # 表结构（从 docs 复制）
  ├── migrations.ts      # 版本迁移管理
  └── types.ts           # 数据库类型定义
```

**关键实现要点**：

1. **Database 类结构**：
```typescript
export class TimeTrackerDatabase {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'timetracker.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
    this.createTables();
  }
}

// 单例导出
export function getDatabase(): TimeTrackerDatabase { ... }
```

2. **schema.sql**：直接从 `docs/database-design.md` 复制完整 SQL

**验收标准**：
- 应用启动后在 `~/Library/Application Support/TimeTracker/` 创建数据库文件
- 数据库包含 `categories` 和 `time_entries` 表
- 初始分类数据（工作/生活/学习）已插入
- 可以通过 SQLite 客户端验证表结构和索引

---

#### 1.3 IPC 通信框架（1 天）✅

**核心任务**：
- 实现 Preload Script（Context Bridge）
- 创建 TypeScript 类型定义
- 实现基础 IPC 错误处理
- 注册测试 handler

**关键文件**：
```
src/preload/
  ├── index.ts           # 预加载脚本
  └── index.d.ts         # TypeScript 类型定义

src/main/ipc/
  ├── index.ts           # IPC 注册入口
  └── handlers.ts        # 测试 handler
```

**关键实现要点**：

1. **Preload Script**：
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args)
});
```

2. **类型定义**：
```typescript
// src/preload/index.d.ts
export interface ElectronAPI {
  invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

3. **测试 Handler**：
```typescript
ipcMain.handle('test:ping', async () => {
  return { success: true, message: 'pong' };
});
```

**验收标准**：
- 渲染进程可以调用 `window.electron.invoke('test:ping')`
- 返回 `{ success: true, message: 'pong' }`
- TypeScript 有完整的类型提示

---

### 阶段 2：核心业务层（5-6 天）✅ 已完成

**目标**：实现所有数据库操作和 IPC API

**完成日期**：2026-01-02

#### 2.1 分类管理 API（1 天）✅

**实现接口**：
- `categories:getAll` - 获取所有分类（含记录数）
- `categories:create` - 创建分类（检测重名）
- `categories:update` - 更新分类
- `categories:delete` - 删除分类（软删除，校验关联记录）

**关键文件**：
```
src/main/ipc/handlers/
  └── categories.ts
```

**技术要点**：
- 名称唯一性校验
- 删除前检查关联记录数
- 至少保留一个启用分类的保护机制
- 统一错误响应格式：`{ error: string, code: string }`

**验收标准**：
- 获取分类列表包含 `entry_count` 字段
- 创建/更新时检测名称重复
- 删除有记录的分类返回错误
- 删除最后一个分类被阻止

---

#### 2.2 时间段记录 API（2 天）✅

**实现接口**：
- `timeEntries:getByDate` - 获取某日记录
- `timeEntries:create` - 创建记录（自动计算时长）
- `timeEntries:update` - 更新记录
- `timeEntries:delete` - 删除记录
- `timeEntries:checkConflict` - 检测时间冲突
- `activities:search` - 搜索历史事项（自动补全）

**关键文件**：
```
src/main/ipc/handlers/
  └── timeEntries.ts
src/main/utils/
  └── time.ts           # 时间计算工具
```

**技术要点**：

1. **时间冲突检测逻辑**（处理四种重叠情况）：
```sql
WHERE date = ?
  AND id != ?  -- 编辑时排除自身
  AND (
    (start_time < ? AND end_time > ?)    -- 新记录被包含
    OR (start_time < ? AND end_time > ?) -- 新记录包含旧记录
    OR (start_time >= ? AND start_time < ?)  -- 开始时间冲突
    OR (end_time > ? AND end_time <= ?)      -- 结束时间冲突
  )
```

2. **时长自动计算**：
```typescript
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}
```

3. **自动补全查询**（按使用频率排序）：
```sql
SELECT DISTINCT activity
FROM time_entries
WHERE activity LIKE ? || '%'
ORDER BY MAX(created_at) DESC
LIMIT 10
```

**验收标准**：
- 按日期查询返回完整记录（含分类信息）
- 时间冲突检测准确（包含编辑场景）
- 自动补全返回最近使用的事项
- duration_minutes 字段自动计算正确

---

#### 2.3 数据分析 API（1 天）✅

**实现接口**：
- `analysis:getCategoryStats` - 分类统计（时长、占比）
- `analysis:getTrendData` - 趋势数据（按日/周聚合）
- `analysis:getTotalHours` - 总用时和记录数

**关键文件**：
```
src/main/ipc/handlers/
  └── analysis.ts
```

**技术要点**：

1. **按日/周聚合**：
```typescript
let dateGroupClause = groupBy === 'day'
  ? 'te.date'
  : "strftime('%Y-W%W', te.date)";  // 按周
```

2. **百分比计算**（处理除零）：
```sql
COALESCE(
  (SUM(te.duration_minutes) * 100.0 / (
    SELECT SUM(duration_minutes)
    FROM time_entries
    WHERE date BETWEEN ? AND ?
  )),
  0
) AS percentage
```

**验收标准**：
- 分类统计数据准确（时长、占比、记录数）
- 趋势数据按日/周正确聚合
- 总用时计算正确
- 空数据处理正确（COALESCE）

---

#### 2.4 Excel 导出服务（1 天）✅

**实现接口**：
- `export:excel` - 导出 Excel 文件（支持范围筛选）

**关键文件**：
```
src/main/services/
  └── excel.ts
src/main/ipc/handlers/
  └── export.ts
```

**技术要点**：

1. **使用 exceljs 库**：
```typescript
import ExcelJS from 'exceljs';
import { dialog } from 'electron';

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('时间记录');

worksheet.columns = [
  { header: '日期', key: 'date', width: 12 },
  { header: '开始时间', key: 'start_time', width: 10 },
  { header: '结束时间', key: 'end_time', width: 10 },
  { header: '事项', key: 'activity', width: 30 },
  { header: '分类', key: 'category', width: 12 },
  { header: '时长(分钟)', key: 'duration_minutes', width: 12 },
];

data.forEach(row => worksheet.addRow(row));

const { filePath } = await dialog.showSaveDialog({
  defaultPath: `TimeTracker_导出_${startDate || 'all'}.xlsx`,
  filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }],
});

await workbook.xlsx.writeFile(filePath);
```

**验收标准**：
- 可以导出全量数据
- 可以按日期范围导出
- Excel 文件格式正确，可用 Excel 打开
- 文件保存对话框正常弹出
- 返回文件路径和记录数

---

### 阶段 3：UI 基础层（3-4 天）✅ 已完成

**目标**：搭建 UI 框架和基础组件

**完成日期**：2026-01-02

#### 3.1 路由和导航（0.5 天）✅

**核心任务**：
- 配置 React Router v6
- 实现应用布局（侧边栏 + 主内容区）
- 创建三个页面骨架

**关键文件**：
```
src/renderer/
  ├── App.tsx
  ├── main.tsx
  ├── router.tsx
  ├── pages/
  │   ├── EntryPage.tsx      # 录入页面
  │   ├── AnalysisPage.tsx   # 分析页面
  │   └── SettingsPage.tsx   # 设置页面
  └── components/layout/
      ├── AppLayout.tsx
      └── Sidebar.tsx
```

**关键实现**：
```typescript
// router.tsx
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <EntryPage /> },
      { path: 'analysis', element: <AnalysisPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

**验收标准**：
- 侧边栏导航可以切换页面
- 页面路由正常（/, /analysis, /settings）
- 布局响应式（侧边栏固定宽度，内容区自适应）

---

#### 3.2 shadcn/ui 集成（0.5 天）✅

**核心任务**：
- 初始化 shadcn/ui CLI
- 添加基础组件（Button, Input, Select, Dialog, Tabs, Toast, Calendar）
- 配置主题色

**操作步骤**：
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input select dialog tabs toast calendar
```

**验收标准**：
- `src/renderer/components/ui/` 包含所有组件
- `tailwind.config.js` 配置正确
- 组件样式正常显示

---

#### 3.3 Zustand Stores（1 天）✅

**核心任务**：
- 创建三个核心 Store
- 封装 IPC 调用逻辑
- 实现错误处理

**关键文件**：
```
src/renderer/store/
  ├── categoriesStore.ts      # 分类数据
  ├── timeEntriesStore.ts     # 时间段记录
  └── analysisStore.ts        # 分析数据缓存
```

**关键实现**：
```typescript
// categoriesStore.ts
import { create } from 'zustand';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (params: CreateCategoryParams) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await window.electron.invoke('categories:getAll');
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

**验收标准**：
- stores 可以正常调用 IPC API
- 状态更新触发组件重新渲染
- 错误处理正确显示

---

#### 3.4 API 封装层（0.5 天）✅

**核心任务**：
- 创建 API 类封装所有 IPC 调用
- 创建完整的 TypeScript 类型定义

**关键文件**：
```
src/renderer/lib/
  └── api.ts
src/renderer/types/
  └── api-types.ts    # 从 docs 复制类型定义
```

**关键实现**：
```typescript
// api.ts
class TimeTrackerAPI {
  async getAllCategories(): Promise<Category[]> {
    return window.electron.invoke('categories:getAll');
  }

  async createTimeEntry(params: CreateTimeEntryParams) {
    return window.electron.invoke('timeEntries:create', params);
  }
}

export const api = new TimeTrackerAPI();
```

**验收标准**：
- API 调用有完整的 TypeScript 类型提示
- 可以在组件中直接使用 `api.xxx()`
- 类型定义与 API 规范一致

---

### 阶段 4：功能实现层（8-10 天）✅ 已完成

**目标**：完成三大核心功能模块

#### 4.1 时间段录入功能（4 天）✅

##### Day 1：表单基础组件 ✅

**实现组件**：
- `TimeInput` - 时间输入（支持 Cmd+T、格式化）
- `CategorySelect` - 分类选择（支持数字键 1/2/3）
- `ActivityAutocomplete` - 事项自动补全

**关键文件**：
```
src/renderer/components/entry/
  ├── TimeInput.tsx
  ├── CategorySelect.tsx
  └── ActivityAutocomplete.tsx
```

**技术要点**：

1. **TimeInput 快捷键支持**：
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 't') {
      e.preventDefault();
      const now = new Date();
      onChange(`${now.getHours()}:${now.getMinutes()}`);
    }
  };
  inputRef.current?.addEventListener('keydown', handleKeyDown);
}, []);
```

2. **格式化输入**（1430 → 14:30）：
```typescript
const handleBlur = () => {
  if (/^\d{3,4}$/.test(value)) {
    const padded = value.padStart(4, '0');
    onChange(`${padded.slice(0, 2)}:${padded.slice(2)}`);
  }
};
```

3. **CategorySelect 数字键支持**：监听 1/2/3 键盘事件

**验收标准**：
- Cmd+T 填充当前时间
- Tab 键切换字段
- 1430 自动格式化为 14:30
- 数字键快速选择分类

---

##### Day 2：表单校验和提交 ✅

**实现组件**：
- `TimeEntryForm` - 完整录入表单
- `ConflictDialog` - 时间冲突提示

**关键文件**：
```
src/renderer/components/entry/
  ├── TimeEntryForm.tsx
  └── ConflictDialog.tsx
src/renderer/schemas/
  └── timeEntry.ts
```

**技术要点**：

1. **Zod Schema 校验**：
```typescript
const timeEntrySchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  activity: z.string().min(1).max(200),
  categoryId: z.number().int().positive(),
}).refine(data => data.endTime > data.startTime, {
  message: '结束时间必须晚于开始时间',
  path: ['endTime'],
});
```

2. **冲突检测和提交流程**：
```typescript
const onSubmit = async (data) => {
  // 1. 检测冲突
  const conflicts = await api.checkConflict({ ... });
  if (conflicts.length > 0) {
    setShowConflictDialog(true);
    return;
  }

  // 2. 保存
  await api.createTimeEntry(data);

  // 3. 清空表单，焦点回到开始时间
  reset();
  startTimeRef.current?.focus();

  // 4. 刷新列表
  await timeEntriesStore.fetchByDate(data.date);

  // 5. Toast 提示
  toast.success('保存成功');
};
```

**验收标准**：
- 表单校验正确（必填、格式、时间大小）
- 时间冲突弹出提示，可选择继续保存
- 保存成功后表单清空，焦点回到开始时间
- Toast 提示显示正常

---

##### Day 3：记录列表和编辑 ✅

**实现组件**：
- `TimeEntryList` - 记录列表容器
- `TimeEntryListItem` - 列表项（支持内联编辑）
- `DeleteConfirmDialog` - 删除确认
- `DateNavigator` - 日期切换

**关键文件**：
```
src/renderer/components/entry/
  ├── TimeEntryList.tsx
  ├── TimeEntryListItem.tsx
  ├── DeleteConfirmDialog.tsx
  └── DateNavigator.tsx
```

**技术要点**：

1. **内联编辑**：
```typescript
const [isEditing, setIsEditing] = useState(false);

if (isEditing) {
  return <TimeEntryForm
    initialData={entry}
    onSubmit={...}
    onCancel={() => setIsEditing(false)}
  />;
}

return <div>{/* 展示模式 */}</div>;
```

2. **撤销删除**（使用 react-hot-toast）：
```typescript
const handleDelete = async (id: number) => {
  const entry = timeEntriesStore.getById(id);
  timeEntriesStore.tempRemove(id);

  toast((t) => (
    <span>
      已删除
      <button onClick={() => {
        timeEntriesStore.restore(entry);
        toast.dismiss(t.id);
      }}>撤销</button>
    </span>
  ), { duration: 5000 });

  setTimeout(() => api.deleteTimeEntry(id), 5000);
};
```

**验收标准**：
- 列表按时间倒序显示
- 点击编辑图标原地展开表单
- 删除后显示撤销按钮，5 秒内可恢复
- 日期切换正常加载数据

---

##### Day 4：集成和优化 ✅

**任务**：
- 整合所有录入组件到 `EntryPage`
- 测试完整录入流程
- 优化交互细节（加载状态、错误提示）
- 添加键盘快捷键提示

**验收标准**：
- 完整录入流程 < 5 秒
- 所有操作可纯键盘完成
- 无卡顿，响应流畅
- 快捷键提示明显

---

#### 4.2 数据分析功能（3 天）✅

##### Day 1：时间维度和统计卡片 ✅

**实现组件**：
- `TimeDimensionTabs` - 时间维度切换
- `StatsCards` - 统计卡片组
- `DateRangePicker` - 自定义日期范围

**关键文件**：
```
src/renderer/components/analysis/
  ├── TimeDimensionTabs.tsx
  ├── StatsCards.tsx
  └── DateRangePicker.tsx
src/renderer/utils/
  └── date.ts
```

**技术要点**：

1. **时间范围计算**（使用 date-fns）：
```typescript
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function getDateRange(dimension: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();
  switch (dimension) {
    case 'week':
      return {
        startDate: formatDate(startOfWeek(now, { weekStartsOn: 1 })),
        endDate: formatDate(endOfWeek(now, { weekStartsOn: 1 })),
      };
    // ...
  }
}
```

2. **统计卡片**：显示总用时 + 各分类时长和占比

**验收标准**：
- Tab 切换改变统计范围
- 统计卡片数据准确
- 自定义日期范围选择器正常

---

##### Day 2：趋势折线图 ✅

**实现组件**：
- `TrendLineChart` - 趋势折线图（Recharts）

**关键文件**：
```
src/renderer/components/analysis/
  ├── TrendLineChart.tsx
  └── utils/chartData.ts
```

**技术要点**：

1. **数据转换**（后端扁平数据 → Recharts 格式）：
```typescript
export function transformTrendData(data: TrendDataPoint[]) {
  // 输入：[{ date_group: '2026-01-01', category_name: '工作', total_hours: 8 }]
  // 输出：[{ date: '2026-01-01', 工作: 8, 生活: 3, 学习: 2 }]

  const grouped = data.reduce((acc, item) => {
    if (!acc[item.date_group]) {
      acc[item.date_group] = { date: item.date_group };
    }
    acc[item.date_group][item.category_name] = item.total_hours;
    return acc;
  }, {});

  return Object.values(grouped);
}
```

2. **Recharts 配置**：
```typescript
<LineChart data={chartData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  {categories.map(cat => (
    <Line key={cat.id} dataKey={cat.name} stroke={cat.color} />
  ))}
</LineChart>
```

**验收标准**：
- 折线图正确显示多条曲线
- 鼠标悬停显示 Tooltip
- 点击图例可以隐藏/显示曲线

---

##### Day 3：分类占比环形图 ✅

**实现组件**：
- `CategoryPieChart` - 分类占比环形图（Recharts）

**关键文件**：
```
src/renderer/components/analysis/
  └── CategoryPieChart.tsx
```

**技术要点**：
```typescript
<PieChart>
  <Pie
    data={data}
    dataKey="total_hours"
    nameKey="name"
    innerRadius={60}
    outerRadius={100}
    label={(entry) => `${entry.name} ${entry.percentage.toFixed(1)}%`}
  >
    {data.map(entry => (
      <Cell key={entry.id} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

**验收标准**：
- 环形图正确显示各分类占比
- 颜色与分类定义一致
- 鼠标悬停显示详细信息

---

#### 4.3 数据管理功能（3 天）✅

##### Day 1：Excel 导出面板 ✅

**实现组件**：
- `ExportDataPanel` - 导出面板
- `ExportConfigDialog` - 导出配置弹窗

**关键文件**：
```
src/renderer/components/settings/
  ├── ExportDataPanel.tsx
  └── ExportConfigDialog.tsx
```

**技术要点**：
```typescript
const handleExport = async () => {
  setIsExporting(true);

  const result = await api.exportExcel({
    startDate: config.startDate,
    endDate: config.endDate,
    categoryIds: config.categoryIds,
  });

  if (result.cancelled) return;

  toast.success(`已导出 ${result.recordCount} 条记录到：${result.filePath}`);
};
```

**验收标准**：
- 可以配置导出范围（全部/日期范围/分类）
- 导出后显示成功提示和文件路径
- 可以点击打开文件

---

##### Day 2：分类管理 ✅

**实现组件**：
- `CategoryManagement` - 分类管理列表
- `CategoryFormModal` - 分类表单弹窗
- `ColorPicker` - 颜色选择器

**关键文件**：
```
src/renderer/components/settings/
  ├── CategoryManagement.tsx
  ├── CategoryFormModal.tsx
  └── ColorPicker.tsx
```

**技术要点**：

1. **删除前校验**：
```typescript
const handleDelete = async (id: number) => {
  const category = categoriesStore.getById(id);

  if (category.entry_count > 0) {
    toast.error(`该分类下有 ${category.entry_count} 条记录，无法删除`);
    return;
  }

  const confirmed = await showConfirmDialog({ ... });
  if (!confirmed) return;

  await api.deleteCategory(id);
  await categoriesStore.fetchCategories();
};
```

**验收标准**：
- 可以新增/编辑/删除分类
- 分类名称不能重复
- 有关联记录的分类无法删除并提示
- 至少保留一个分类

---

##### Day 3：集成和测试 ✅

**任务**：
- 整合导出和分类管理功能到 `SettingsPage`
- 测试完整流程
- 优化 UI 细节

**验收标准**：
- 所有设置功能正常工作
- 错误提示友好
- 操作响应快速

---

### 阶段 5：集成测试与优化（2-3 天）

#### 5.1 功能集成测试（1 天）

**测试场景**：

1. **录入 → 分析数据流**：
   - 录入新记录
   - 切换到分析页面
   - 验证统计数据已更新

2. **导出 → 数据一致性**：
   - 导出全量数据
   - 对比 Excel 与数据库记录数
   - 验证数据格式正确

3. **分类删除 → 关联记录校验**：
   - 尝试删除有记录的分类
   - 验证错误提示
   - 删除无记录的分类成功

**验收标准**：
- 所有核心流程无阻塞性 bug
- 数据一致性验证通过

---

#### 5.2 性能优化（1 天）

**优化项**：

1. **列表虚拟滚动**（使用 react-window）：
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={entries.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <TimeEntryListItem entry={entries[index]} />
    </div>
  )}
</FixedSizeList>
```

2. **图表懒加载**：
```typescript
const TrendLineChart = lazy(() => import('@/components/analysis/TrendLineChart'));

<Suspense fallback={<Skeleton />}>
  <TrendLineChart data={trendData} />
</Suspense>
```

3. **数据库查询索引验证**：
```sql
EXPLAIN QUERY PLAN
SELECT * FROM time_entries WHERE date = '2026-01-02';
-- 验证使用了 idx_time_entries_date 索引
```

**验收标准**：
- 1000+ 条记录列表滚动流畅
- 图表渲染 < 500ms
- 数据库查询使用索引

---

#### 5.3 用户体验优化（1 天）

**优化项**：

1. **加载状态**（使用 shadcn/ui Skeleton）
2. **错误边界**（防止白屏）
3. **Toast 通知**（统一使用 react-hot-toast）
4. **快捷键提示**（在表单附近显示）

**验收标准**：
- 无白屏，有加载状态
- 错误提示清晰友好
- 快捷键提示明显

---

## 开发优先级

### P0（必做，MVP 第一版）

- ✅ 基础设施层（全部）
- ✅ 核心业务层（全部 API）
- ✅ 时间段录入功能（完整）
- ✅ 数据分析功能（核心图表）
- ✅ Excel 导出
- ✅ 分类管理

### P1（次优先，第二迭代）

- Excel 导入功能
- 历史数据浏览（搜索过滤、分页）
- 事项时长排行

### P2（可选，未来增强）

- 自动备份提醒
- 深色模式
- 全局快捷键唤醒
- 自然语言输入

---

## 风险控制

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| better-sqlite3 编译失败 | 无法启动项目 | 使用 electron-rebuild；提供预编译方案 |
| 时间冲突检测性能 | 查询变慢 | 为 (date, start_time) 建立复合索引 |
| 大数据量导入卡顿 | 用户体验差 | 批量插入事务；显示进度条 |
| Recharts 数据量过大 | 图表渲染慢 | 超过 30 天按周聚合；超过 90 天按月聚合 |

### 业务风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Excel 格式不兼容 | 导入失败 | 详细错误日志；提供模板文件 |
| 误删分类 | 数据关系混乱 | 软删除；关联记录校验；确认对话框 |
| 时间冲突误判 | 阻碍录入 | 仅警告不阻止；提供"仍然保存"选项 |

---

## 关键文件路径清单

### 主进程（Main Process）

```
src/main/
├── index.ts                      # 主进程入口
├── database/
│   ├── index.ts                  # Database 类封装
│   ├── schema.sql                # 数据库表结构
│   ├── migrations.ts             # 版本迁移
│   └── types.ts                  # 数据库类型定义
├── ipc/
│   ├── index.ts                  # IPC 注册入口
│   └── handlers/
│       ├── categories.ts         # 分类管理 handlers
│       ├── timeEntries.ts        # 时间段记录 handlers
│       ├── analysis.ts           # 数据分析 handlers
│       └── export.ts             # 导出 handlers
├── services/
│   └── excel.ts                  # Excel 服务
└── utils/
    ├── paths.ts                  # 路径管理
    └── time.ts                   # 时间计算工具
```

### 渲染进程（Renderer Process）

```
src/renderer/
├── main.tsx                      # React 入口
├── App.tsx                       # 应用根组件
├── router.tsx                    # 路由配置
├── pages/
│   ├── EntryPage.tsx             # 录入页面
│   ├── AnalysisPage.tsx          # 分析页面
│   └── SettingsPage.tsx          # 设置页面
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── Sidebar.tsx
│   ├── entry/
│   │   ├── TimeEntryForm.tsx
│   │   ├── TimeInput.tsx
│   │   ├── CategorySelect.tsx
│   │   ├── TimeEntryList.tsx
│   │   └── TimeEntryListItem.tsx
│   ├── common/
│   │   └── ActivityAutocomplete.tsx
│   ├── analysis/
│   │   ├── TimeDimensionTabs.tsx
│   │   ├── StatsCards.tsx
│   │   ├── TrendLineChart.tsx
│   │   └── CategoryPieChart.tsx
│   ├── settings/
│   │   ├── ExportDataPanel.tsx
│   │   ├── CategoryManagement.tsx
│   │   └── CategoryFormModal.tsx
│   └── ui/                       # shadcn/ui 组件
├── store/
│   ├── categoriesStore.ts
│   ├── timeEntriesStore.ts
│   └── analysisStore.ts
├── lib/
│   └── api.ts                    # API 封装层
├── types/
│   └── api-types.ts              # API 类型定义
├── schemas/
│   └── timeEntry.ts              # 表单校验 schema
├── utils/
│   ├── date.ts                   # 日期工具
│   └── chartData.ts              # 图表数据转换
└── styles/
    └── globals.css               # 全局样式
```

### 预加载脚本（Preload）

```
src/preload/
├── index.ts                      # 预加载脚本
└── index.d.ts                    # TypeScript 类型定义
```

### 配置文件

```
timetable/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── electron.vite.config.ts
├── tailwind.config.js
├── components.json               # shadcn/ui 配置
├── .eslintrc.cjs
├── .prettierrc
└── .gitignore
```

---

## 预计开发周期

- **阶段 1（基础设施）**：3-4 天
- **阶段 2（核心业务）**：5-6 天
- **阶段 3（UI 基础）**：3-4 天
- **阶段 4（功能实现）**：8-10 天
- **阶段 5（测试优化）**：2-3 天

**总计**：21-27 天（约 4-5 周）

---

## 关键里程碑

1. **Week 1 结束**：数据库 + IPC 框架完成，可以通过 IPC 查询数据
2. **Week 2 结束**：所有 API 实现完成，UI 框架搭建完成
3. **Week 3 结束**：录入功能完成，可以录入和查看记录
4. **Week 4 结束**：分析和数据管理功能完成
5. **Week 5 结束**：测试优化完成，MVP 发布

---

## 下一步行动

1. ✅ 确认开发计划无遗漏
2. 准备开发环境（安装 Node.js、配置编辑器）
3. 开始阶段 1：项目初始化
