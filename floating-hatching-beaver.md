# TimeTracker V3.0 开发计划

**项目状态**: 全新项目，无历史数据，无需迁移
**开发模式**: 重构现有代码，直接实现 V3.0 设计
**预计工作量**: 15-18 天（约 3-4 周）

---

## 核心变更概览

### 设计变更
1. **录入模式**: Timer（计时器） → Switch（时间切分器）
2. **分类系统**: 固定分类 → 多维度标签
3. **数据模型**: 2 张表 → 4 张表
4. **核心交互**: 开始/暂停/停止 → 快速切换输入

### 代码复用率
- ✅ 可复用 85%：shadcn/ui 组件、部分业务组件、基础设施
- 🔄 需重构 10%：录入页面核心组件、IPC 处理器、Store
- ❌ 需删除 5%：Timer 相关组件（CircularTimer, TimerControls, timerStore）

---

## 阶段一：数据层重构（P0）

**目标**: 创建全新的多维度数据库 Schema
**工作量**: 2 天

### 任务 1.1：重写数据库 Schema（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/database/schema.sql`

**操作**: 完全重写，删除旧结构

**新 Schema**:
```sql
-- 1. 维度表
CREATE TABLE dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. 维度选项表
CREATE TABLE dimension_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (dimension_id) REFERENCES dimensions(id) ON DELETE CASCADE,
  UNIQUE(dimension_id, name)
);

-- 3. 时间记录表（重构）
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,  -- ISO 8601: 2026-01-03T09:00:15
  end_time TEXT,              -- NULL = 正在进行中
  duration_seconds INTEGER,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 4. 记录-选项关联表
CREATE TABLE entry_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (entry_id) REFERENCES time_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES dimension_options(id) ON DELETE RESTRICT,
  UNIQUE(entry_id, option_id)
);

-- 索引
CREATE INDEX idx_time_entries_date ON time_entries(DATE(start_time));
CREATE INDEX idx_time_entries_end_time ON time_entries(end_time);
CREATE INDEX idx_entry_attributes_entry ON entry_attributes(entry_id);
CREATE INDEX idx_entry_attributes_option ON entry_attributes(option_id);
CREATE INDEX idx_dimensions_active ON dimensions(is_active);
CREATE INDEX idx_dimensions_order ON dimensions("order");
CREATE INDEX idx_options_dimension ON dimension_options(dimension_id);

-- 初始数据：创建默认维度
INSERT INTO dimensions (id, name, is_active, "order") VALUES
  (1, '领域', 1, 1),
  (2, '项目', 1, 2),
  (3, '质量', 1, 3);

INSERT INTO dimension_options (dimension_id, name, color, "order") VALUES
  -- 领域
  (1, '工作', '#3B82F6', 1),
  (1, '学习', '#10B981', 2),
  (1, '生活', '#F59E0B', 3),
  (1, '娱乐', '#EC4899', 4),
  -- 项目
  (2, '无', '#94A3B8', 1),
  -- 质量
  (3, '高效', '#22C55E', 1),
  (3, '正常', '#A3A3A3', 2),
  (3, '摸鱼', '#EF4444', 3);
```

**删除**: 旧的 categories 表定义

---

### 任务 1.2：更新 TypeScript 类型定义（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/database/types.ts`

**新增类型**:
```typescript
export interface Dimension {
  id: number
  name: string
  is_active: number
  order: number
  created_at: string
  updated_at: string
}

export interface DimensionOption {
  id: number
  dimension_id: number
  name: string
  color: string
  order: number
  created_at: string
  updated_at: string
}

export interface EntryAttribute {
  id: number
  entry_id: number
  option_id: number
  created_at: string
}

export interface TimeEntryWithDimensions {
  id: number
  title: string
  start_time: string
  end_time: string | null
  duration_seconds: number
  description?: string
  created_at: string
  updated_at: string
  dimensions: Array<{
    dimension_id: number
    dimension_name: string
    option_id: number
    option_name: string
    option_color: string
  }>
}

export interface Gap {
  start_time: string
  end_time: string
  duration_seconds: number
}
```

**删除**: Category 类型

---

### 任务 1.3：重写 IPC 处理器（✅ 已完成）

#### A. 新增维度管理 Handler
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/dimensions.ts`（新建）

**接口清单**:
- `dimensions:getAll` - 获取所有维度（包含选项）
- `dimensions:create` - 创建维度
- `dimensions:update` - 更新维度
- `dimensions:delete` - 删除维度
- `dimensions:toggle` - 启用/禁用维度
- `options:create` - 创建选项
- `options:update` - 更新选项
- `options:delete` - 删除选项

#### B. 重构时间记录 Handler
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/timeEntries.ts`

**修改接口**:
- `timeEntries:create` - 支持多维度选项（插入 entry_attributes）
- `timeEntries:update` - 支持更新维度选项（先删后插）
- `timeEntries:getByDate` - JOIN 查询返回完整维度

**新增接口**:
- `timeEntries:getCurrentActive` - 获取正在进行的记录（end_time IS NULL）
- `timeEntries:switch` - 核心"切换"操作（结束当前 + 开始新的）
- `timeEntries:detectGaps` - Gap 检测
- `activities:getSmartDefaults` - 基于事项名称获取智能默认

**关键 SQL - Switch 操作**:
```sql
-- 1. 结束当前正在进行的记录
UPDATE time_entries
SET
  end_time = datetime('now', 'localtime'),
  duration_seconds = CAST((julianday(datetime('now', 'localtime')) - julianday(start_time)) * 86400 AS INTEGER),
  updated_at = datetime('now', 'localtime')
WHERE end_time IS NULL;

-- 2. 创建新记录
INSERT INTO time_entries (title, start_time, end_time, duration_seconds)
VALUES (?, datetime('now', 'localtime'), NULL, 0);

-- 3. 关联维度选项
INSERT INTO entry_attributes (entry_id, option_id)
VALUES (?, ?), (?, ?), (?, ?);
```

**关键 SQL - Gap 检测**:
```sql
WITH ordered_entries AS (
  SELECT
    id,
    start_time,
    end_time,
    LEAD(start_time) OVER (ORDER BY start_time) AS next_start
  FROM time_entries
  WHERE DATE(start_time) = ?
)
SELECT
  end_time AS gap_start,
  next_start AS gap_end,
  CAST((julianday(next_start) - julianday(end_time)) * 86400 AS INTEGER) AS duration_seconds
FROM ordered_entries
WHERE next_start IS NOT NULL
  AND end_time IS NOT NULL
  AND end_time < next_start;
```

#### C. 删除旧 Handler
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/categories.ts`

**操作**: 完全删除此文件

---

## 阶段二：前端状态管理重构（P0）

**目标**: 适配新数据模型，移除 Timer 状态
**工作量**: 2 天

### 任务 2.1：新增维度管理 Store（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/dimensionsStore.ts`（新建）

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

interface DimensionsState {
  dimensions: DimensionWithOptions[]
  activeDimensions: DimensionWithOptions[]
  isLoading: boolean
  error: string | null

  fetchDimensions: () => Promise<void>
  createDimension: (params: CreateDimensionParams) => Promise<void>
  updateDimension: (id: number, params: UpdateDimensionParams) => Promise<void>
  deleteDimension: (id: number) => Promise<void>
  toggleDimension: (id: number) => Promise<void>

  createOption: (dimensionId: number, params: CreateOptionParams) => Promise<void>
  updateOption: (id: number, params: UpdateOptionParams) => Promise<void>
  deleteOption: (id: number) => Promise<void>
}

export const useDimensionsStore = create<DimensionsState>()(
  persist(
    (set, get) => ({
      dimensions: [],
      activeDimensions: [],
      isLoading: false,
      error: null,

      fetchDimensions: async () => {
        set({ isLoading: true })
        try {
          const result = await api.getAllDimensions()
          if ('error' in result) {
            set({ error: result.error, isLoading: false })
          } else {
            set({
              dimensions: result,
              activeDimensions: result.filter(d => d.is_active),
              isLoading: false
            })
          }
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      // 其他方法...
    }),
    { name: 'dimensions-storage' }
  )
)
```

---

### 任务 2.2：重构 TimeEntries Store（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/timeEntriesStore.ts`

**核心新增方法**:
```typescript
interface TimeEntriesState {
  // 现有字段...
  currentActive: TimeEntryWithDimensions | null
  gaps: Gap[]

  // 新增方法
  getCurrentActive: () => Promise<void>
  switchActivity: (title: string, optionIds: number[]) => Promise<void>
  detectGaps: (date: string) => Promise<void>
  getSmartDefaults: (title: string) => Promise<number[]>

  // 修改方法
  createEntry: (params: CreateTimeEntryParams) => Promise<void>  // 支持多维度
  updateEntry: (id: number, params: UpdateTimeEntryParams) => Promise<void>
}

// 核心实现 - switchActivity
switchActivity: async (title: string, optionIds: number[]) => {
  try {
    await api.switchActivity({ title, optionIds })

    // 刷新当前活动
    await get().getCurrentActive()

    // 刷新今日列表
    const today = format(new Date(), 'yyyy-MM-dd')
    await get().fetchByDate(today)

    // 重新检测 Gap
    await get().detectGaps(today)
  } catch (error) {
    set({ error: error.message })
  }
}
```

---

### 任务 2.3：删除 Timer Store（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/timerStore.ts`

**操作**: 完全删除此文件

---

## 阶段三：核心 UI 组件重构（P0）

**目标**: 实现"时间切分器"交互
**工作量**: 4 天

### 任务 3.1：创建"当前正在进行"卡片（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/CurrentActivityCard.tsx`（新建）

**功能**:
- 展示当前正在进行的事项名称
- 展示已持续时长（每分钟刷新）
- 展示维度标签（彩色徽章）
- 空状态处理

**UI 参考**:
```tsx
<Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">正在进行</p>
        <h2 className="text-2xl font-medium mt-1">{activity.title}</h2>
      </div>
      <div className="text-right">
        <p className="text-lg text-slate-600">已持续</p>
        <p className="text-3xl font-mono font-semibold text-blue-600">
          {formatDuration(duration)}
        </p>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      {activity.dimensions.map(dim => (
        <Badge key={dim.option_id} style={{ backgroundColor: dim.option_color }}>
          {dim.dimension_name}: {dim.option_name}
        </Badge>
      ))}
    </div>
  </CardContent>
</Card>
```

---

### 任务 3.2：创建快速切换输入框（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/SwitchInput.tsx`（新建）

**功能**:
- 事项名称输入（支持自动补全）
- Cmd+K 快捷键聚焦
- 回车后触发维度选择器

**使用组件**:
- 复用现有 `ActivityAutocomplete.tsx`
- 调整触发逻辑（回车 → 打开 DimensionSelector）

---

### 任务 3.3：创建多维度选择器弹窗（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/DimensionSelector.tsx`（新建）

**功能**:
- 展示所有已启用维度
- 每个维度单选其选项
- 支持键盘操作（Tab、数字键、Enter）
- 智能默认回填

**键盘操作**:
- `Tab` - 切换维度
- `1-9` - 快速选择选项
- `Enter` - 确认并调用 switchActivity

**UI 结构**:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>为 "{activityName}" 选择标签</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {dimensions.map((dim, dimIndex) => (
        <div key={dim.id}>
          <Label>{dim.name}</Label>
          <RadioGroup
            value={selectedOptions[dim.id]?.toString()}
            onValueChange={(val) => handleOptionChange(dim.id, parseInt(val))}
          >
            {dim.options.map((opt, optIndex) => (
              <div key={opt.id} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.id.toString()} id={`opt-${opt.id}`} />
                <Label htmlFor={`opt-${opt.id}`} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.name}
                  <span className="text-xs text-muted-foreground">({optIndex + 1})</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>

    <DialogFooter>
      <Button onClick={handleConfirm}>确认 (Enter)</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 任务 3.4：重构录入面板（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/TimerPanel.tsx`

**操作**: 重命名为 `SwitchPanel.tsx`，完全重写

**新布局**:
```tsx
export function SwitchPanel() {
  return (
    <div className="p-8 space-y-6">
      <CurrentActivityCard />
      <SwitchInput />
      <DailyStatsCard />
    </div>
  )
}
```

**删除组件**:
- `CircularTimer.tsx` - 完全删除
- `TimerControls.tsx` - 完全删除

---

### 任务 3.5：Gap 检测 UI（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/TimeEntryList.tsx`

**修改**: 在记录之间插入 Gap 卡片

**Gap 卡片**:
```tsx
{gaps.map(gap => (
  <div
    key={`gap-${gap.start_time}`}
    className="bg-red-50 border-2 border-red-300 border-dashed rounded-lg p-4 my-2"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-red-700 font-medium">
          🚫 {formatTime(gap.start_time)} - {formatTime(gap.end_time)}
          ({formatDuration(gap.duration_seconds)} 未记录)
        </p>
        <p className="text-sm text-red-600 mt-1">点击补录</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => openFillGapDialog(gap)}
      >
        补录
      </Button>
    </div>
  </div>
))}
```

---

## 阶段四：维度管理 UI（P0）

**目标**: 实现维度配置管理界面
**工作量**: 3 天

### 任务 4.1：维度管理页面（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/DimensionManagement.tsx`（新建）

**功能**:
- 已启用维度列表（可折叠）
- 已禁用维度列表
- 拖拽排序
- CRUD 操作按钮

---

### 任务 4.2：维度/选项表单弹窗（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/DimensionFormModal.tsx`（新建）

**功能**:
- 创建/编辑维度
- 创建/编辑选项（含颜色选择器）
- 表单验证

**颜色选择器**: 使用 shadcn/ui Popover + 色板

---

### 任务 4.3：重构设置页面（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/pages/SettingsPage.tsx`

**修改**:
- 移除 CategoryManagement
- 新增 DimensionManagement
- 保留 ExportDataPanel

---

## 阶段五：分析模块适配（P1）

**目标**: 适配多维度数据分析
**工作量**: 2 天

### 任务 5.1：多维度统计 IPC（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/analysis.ts`

**新增接口**:
- `analysis:statsByDimension` - 按指定维度聚合
- `analysis:trendByDimension` - 按维度趋势

**关键 SQL**:
```sql
SELECT
  do.id AS option_id,
  do.name AS option_name,
  do.color,
  SUM(te.duration_seconds) / 3600.0 AS hours,
  SUM(te.duration_seconds) * 100.0 / (
    SELECT SUM(duration_seconds)
    FROM time_entries
    WHERE DATE(start_time) BETWEEN ? AND ?
  ) AS percentage
FROM time_entries te
JOIN entry_attributes ea ON te.id = ea.entry_id
JOIN dimension_options do ON ea.option_id = do.id
WHERE do.dimension_id = ?
  AND DATE(te.start_time) BETWEEN ? AND ?
GROUP BY do.id
ORDER BY hours DESC;
```

---

### 任务 5.2：图表组件适配（✅ 已完成）
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/analysis/`

**修改**:
- `CategoryPieChart.tsx` → `DimensionPieChart.tsx`
- 新增维度选择下拉框
- 图表颜色使用选项配置的颜色

---

## 阶段六：Excel 导入导出适配（P1）

**目标**: 支持多维度数据导入导出
**工作量**: 2 天

### 任务 6.1：Excel 导出适配
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/services/excel.ts`

**修改**: 维度展开为多列

**导出格式**:
| 日期 | 开始时间 | 结束时间 | 事项 | 领域 | 项目 | 质量 | 时长(小时) |
|------|---------|---------|------|------|------|------|-----------|

---

### 任务 6.2：Excel 导入
**文件**: `/Users/lok666/Desktop/othercode/timetable/src/main/services/excelImport.ts`（新建）

**功能**:
- 解析 Excel 文件
- 智能映射列名到维度
- 批量插入（事务保护）

---

## 阶段七：测试与优化（P0）

**目标**: 确保核心功能稳定
**工作量**: 2 天

### 任务 7.1：功能测试
**测试用例**:
- [ ] 切换录入 10 次，检查连续性
- [ ] 智能默认准确率
- [ ] Gap 检测准确性
- [ ] 维度管理完整流程

---

### 任务 7.2：性能优化
**优化点**:
- 维度列表缓存
- 智能默认查询缓存
- 数据库索引验证

**性能目标**:
- 应用启动 < 2s
- 切换操作 < 200ms
- Gap 检测 < 50ms

---

## 关键文件清单

### 需要删除的文件
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/CircularTimer.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/TimerControls.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/timerStore.ts`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/hooks/useTimerTick.ts`
- `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/categories.ts`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/CategoryManagement.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/CategoryFormModal.tsx`

### 需要重写的文件
- `/Users/lok666/Desktop/othercode/timetable/src/main/database/schema.sql` ⭐
- `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/timeEntries.ts` ⭐
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/timeEntriesStore.ts` ⭐
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/TimerPanel.tsx` ⭐

### 需要新建的文件
- `/Users/lok666/Desktop/othercode/timetable/src/main/ipc/handlers/dimensions.ts` ⭐
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/store/dimensionsStore.ts`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/CurrentActivityCard.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/SwitchInput.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/entry/DimensionSelector.tsx` ⭐
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/DimensionManagement.tsx`
- `/Users/lok666/Desktop/othercode/timetable/src/renderer/src/components/settings/DimensionFormModal.tsx`

---

## 开发顺序建议

**Week 1**: 阶段一 + 阶段二（数据层 + 状态管理）
**Week 2**: 阶段三（核心 UI）
**Week 3**: 阶段四 + 阶段五（维度管理 + 分析）
**Week 4**: 阶段六 + 阶段七（导入导出 + 测试）

---

## 验收标准

### 功能验收
- [ ] 切换录入单次 < 3 秒
- [ ] 智能默认准确率 > 80%
- [ ] Gap 检测零漏报
- [ ] 可创建/编辑/删除维度和选项
- [ ] 禁用维度后历史数据仍可查看
- [ ] 可按任意维度聚合统计

### 性能验收
- [ ] 应用启动 < 2s
- [ ] 切换操作 < 200ms
- [ ] 数据库查询 < 100ms

### 用户体验验收
- [ ] 键盘操作占比 > 90%
- [ ] 界面干净无冗余
- [ ] 无明显卡顿

---

**预计总工作量**: 15-18 天
**风险等级**: 低（无历史数据迁移负担）
