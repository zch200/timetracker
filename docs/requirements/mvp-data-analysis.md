# 数据分析功能（MVP 核心）

---

## 元信息

- **所属系统**：TimeTracker
- **所属模块**：数据分析模块
- **创建时间**：2026-01-02
- **最后更新**：2026-01-03
- **当前版本**：v3.0
- **状态**：规划中
- **负责人**：lok666

---

## 变更历史

| 日期 | 版本 | 变更类型 | 变更内容 | 影响文件 | 变更人 |
|------|------|----------|----------|----------|--------|
| 2026-01-03 | v3.0 | 重构 | 【核心架构变更】<br>1. 分析维度从"固定分类"升级为"动态多维度"<br>2. 新增"维度选择器"（可选择任意维度作为分析主维度）<br>3. 新增"维度交叉分析"（如："工作"领域下各项目的时长分布）<br>4. 统计卡片支持动态展示已启用维度的汇总数据<br>5. 图表支持按多个维度组合筛选<br>6. 新增"维度对比"功能（对比不同选项的时长趋势） | 全部功能描述、统计逻辑、UI 设计 | lok666 |
| 2026-01-02 | v1.0 | 新增 | 初始版本（固定分类分析） | 全部 | lok666 |

---

## 业务背景

用户坚持记录时间 5 年以上，积累了 6.6 万条数据，但在 Excel 中分析数据存在以下痛点：
1. **手动制图繁琐**：需要手动创建数据透视表和图表，耗时且易出错
2. **维度切换困难**：切换时间范围（日/周/月）需要重新筛选数据
3. **趋势不直观**：无法快速看出时间分配的变化规律
4. **对比分析困难**：难以对比不同分类或事项的时长占比
5. **多维度分析缺失**：只能按单一"分类"分析，无法深入洞察（如："工作"时间中各项目的占比）

**核心诉求**：自动化数据统计与可视化，支持多维度灵活分析，快速回答"我的时间都去哪儿了"。

**新增需求（V3.0）**：
- 支持按任意维度（领域/项目/质量等）作为主分析维度
- 支持维度交叉分析（如：在"工作"领域下，各"项目"的时长分布）
- 支持维度对比（如：对比"高效"vs"摸鱼"时段的事项构成）

---

## 核心设计理念

### 1. 灵活的分析维度

**传统方式（V1.0）**：
- 固定按"分类"（工作/学习/生活）分析
- 无法切换到其他视角（如按"项目"或"质量"分析）

**新方式（V3.0）**：
- 用户可选择任意已启用的维度作为主分析维度
- 例如：
  - 选择"领域"维度 → 分析工作/学习/生活的时长分布
  - 切换到"项目"维度 → 分析 TimeTracker/CRM 等项目的时长分布
  - 切换到"质量"维度 → 分析高效/正常/摸鱼的时长分布

### 2. 维度交叉分析

**场景示例**：
- **问题**：我的"工作"时间都花在哪些项目上了？
- **操作**：
  1. 主维度选择："领域"
  2. 在"工作"的统计卡片上点击"下钻"
  3. 显示"工作"领域下各"项目"的时长分布

**技术实现**：
- 一级维度：按主维度分组统计
- 二级维度：在一级维度的某个选项内，按另一个维度分组统计

### 3. 自适应UI

**根据已启用维度动态调整界面**：
- 如果只启用了 1 个维度 → 界面简化，直接显示该维度的统计
- 如果启用了 3 个维度 → 界面提供维度切换器，用户可自由选择
- 统计卡片数量 = 已启用维度的选项总数（最多显示前 5 个）

---

## 功能描述

### 1. 时间维度切换（保留 V1.0 功能）

#### 1.1 维度选择器

**布局位置**：页面顶部水平 Tab 切换

**可选维度**：
- 今日：统计当天数据
- 本周：统计本周一至今天（或周一到周日）
- 本月：统计本月 1 日至今天（或整月）
- 本年：统计 1 月 1 日至今天（或整年）
- 自定义：弹出日期范围选择器

**Tab 样式示例**：
```
┌────┬────┬────┬────┬──────┐
│今日│本周│本月│本年│自定义│
└────┴────┴────┴────┴──────┘
  ↑ 当前选中(蓝色下划线)
```

**默认行为**：
- 首次进入页面默认展示"本周"数据
- 用户选择后记住偏好（存储在 localStorage）

#### 1.2 自定义日期范围

**交互流程**：
1. 点击"自定义"Tab
2. 弹出日期范围选择器（双日历）
3. 选择起止日期后点击"确认"
4. 关闭弹窗，刷新图表数据

**日期选择器样式**：
- 使用 shadcn/ui 的 DateRangePicker 组件
- 支持快捷选项：最近 7 天、最近 30 天、最近 90 天

**限制**：
- 最大范围不超过 1 年（避免数据量过大导致性能问题）

---

### 2. 分析维度选择器（核心新增）

#### 2.1 维度选择器位置

**布局位置**：时间维度选择器的右侧或下方

**界面示例**：
```
┌────────────────────────────────────────────────┐
│ 时间范围: [今日] [本周] [本月] [本年] [自定义] │
│                                                │
│ 分析维度: [领域 ▼]  筛选: [项目: 全部 ▼]      │
└────────────────────────────────────────────────┘
```

**组件说明**：
- **分析维度下拉框**：选择主分析维度
- **筛选下拉框**：针对其他维度进行筛选（可选）

#### 2.2 维度选择逻辑

**主维度选择**：
- 下拉框显示所有已启用的维度
- 选择后，统计卡片和图表自动刷新，按该维度分组

**示例**：
```
主维度 = "领域"
统计结果：
  - 工作: 40h (50%)
  - 学习: 20h (25%)
  - 生活: 20h (25%)

切换主维度 = "项目"
统计结果：
  - TimeTracker: 30h (37.5%)
  - CRM: 25h (31.25%)
  - 无: 25h (31.25%)
```

#### 2.3 多维度筛选

**场景**：用户想分析"高效"时段的时间分配。

**操作**：
1. 主维度选择："领域"
2. 筛选条件："质量 = 高效"
3. 结果：显示"高效"时段下，工作/学习/生活的时长分布

**筛选器 UI**：
```
┌────────────────────────────────────────────┐
│ 筛选条件:                                   │
│  项目: [全部 ▼]                            │
│  质量: [高效 ▼]                            │
│                                            │
│  [ 清除筛选 ]                              │
└────────────────────────────────────────────┘
```

**逻辑**：
- 筛选器只显示"非主维度"的其他维度
- 每个筛选器可选择"全部"或某个具体选项
- 多个筛选条件之间是"AND"关系

---

### 3. 统计概览卡片（动态适配）

#### 3.1 卡片布局

**水平排列，数量根据主维度的选项数量动态调整**：

**示例 1：主维度 = "领域"（4 个选项）**
```
┌────────┬────────┬────────┬────────┐
│总用时   │工作    │学习    │生活    │
│168.5 h │80.0 h  │50.5 h  │38.0 h  │
│        │47.5%   │30.0%   │22.5%   │
└────────┴────────┴────────┴────────┘
```

**示例 2：主维度 = "项目"（假设有 6 个项目）**
```
┌────────┬────────┬────────┬────────┬────────┐
│总用时   │TT      │CRM     │装修    │其他... │
│168.5 h │60.0 h  │40.0 h  │30.0 h  │[更多▼] │
│        │35.6%   │23.7%   │17.8%   │        │
└────────┴────────┴────────┴────────┴────────┘
```

**规则**：
- 第一张卡片固定为"总用时"
- 后续卡片按主维度的选项排列
- 最多显示 5 张卡片（含总用时），多余的折叠到"更多"下拉菜单

#### 3.2 总用时卡片

**显示内容**：
- 大标题："总用时"
- 数值：所选时间范围内的总时长（小时，保留 1 位小数）
- 辅助信息：记录条数（如"共 120 条记录"）

**计算逻辑**：
```sql
SELECT 
  SUM(duration_seconds) / 3600.0 AS total_hours,
  COUNT(*) AS total_count
FROM time_entries
WHERE DATE(start_time) BETWEEN ? AND ?
```

#### 3.3 维度选项卡片

**显示内容**：
- 大标题：选项名称（如"工作"）
- 数值：该选项的总时长
- 占比：该选项占总时长的百分比
- 颜色：使用选项配置的颜色作为卡片边框或图标颜色

**计算逻辑**：
```sql
SELECT 
  o.name AS option_name,
  o.color,
  SUM(te.duration_seconds) / 3600.0 AS total_hours,
  SUM(te.duration_seconds) * 100.0 / (
    SELECT SUM(duration_seconds) FROM time_entries WHERE DATE(start_time) BETWEEN ? AND ?
  ) AS percentage
FROM time_entries te
JOIN entry_attributes ea ON te.id = ea.entry_id
JOIN dimension_options o ON ea.option_id = o.id
JOIN dimensions d ON o.dimension_id = d.id
WHERE d.id = ? AND DATE(te.start_time) BETWEEN ? AND ?
GROUP BY o.id
ORDER BY total_hours DESC;
```

#### 3.4 交互行为

**点击卡片**：
- 触发"下钻"功能
- 弹出详情弹窗，显示该选项下的二级维度分析

**悬浮效果**：
- 卡片轻微放大（scale: 1.02）
- 阴影加深
- 鼠标变为指针

---

### 4. 可视化图表

#### 4.1 图表组件列表

**页面包含 3 个核心图表**：
1. **维度时长趋势图**（折线图）
2. **每日维度分布图**（堆叠柱状图）
3. **维度占比图**（环形图）

**布局方式**：
- 垂直堆叠
- 每个图表占据完整宽度
- 图表之间间距 24px

#### 4.2 维度时长趋势图（折线图）

**功能说明**：
- 展示所选主维度下各选项的时长变化趋势
- X 轴：日期
- Y 轴：时长（小时）
- 多条曲线：每个选项一条曲线

**图表示例**：
```
时长(h)
  30 ┤
     │         ╱╲
  20 ┤   ╱╲  ╱  ╲     —— 工作
     │  ╱  ╲╱    ╲   ---- 学习
  10 ┤ ╱           ╲╱  ··· 生活
     │╱
   0 └──────────────────────
     周一 周二 周三 周四 周五 周六 周日
```

**交互功能**：
- 鼠标悬浮在数据点上，显示 Tooltip（日期 + 选项 + 具体时长）
- 点击图例可以隐藏/显示某条曲线
- 支持缩放（鼠标滚轮放大/缩小）

**数据查询逻辑**：
```sql
SELECT 
  DATE(te.start_time) AS date,
  o.name AS option_name,
  o.color,
  SUM(te.duration_seconds) / 3600.0 AS hours
FROM time_entries te
JOIN entry_attributes ea ON te.id = ea.entry_id
JOIN dimension_options o ON ea.option_id = o.id
JOIN dimensions d ON o.dimension_id = d.id
WHERE d.id = ? AND DATE(te.start_time) BETWEEN ? AND ?
GROUP BY DATE(te.start_time), o.id
ORDER BY date, o.id;
```

#### 4.3 每日维度分布图（堆叠柱状图）

**功能说明**：
- 展示每天的时间总量及各维度选项的分布
- X 轴：日期
- Y 轴：累计时长（小时）
- 柱状图：不同颜色堆叠，表示不同选项

**图表示例**：
```
时长(h)
  24 ┤
     │     ╔═══╗
  18 ┤     ║ 娱║
     │╔═══╗╠═══╣╔═══╗
  12 ┤║生活║║ 生║║ 生║
     │╠═══╣╠═══╣╠═══╣
   6 ┤║学习║║ 学║║ 学║
     │╠═══╣╠═══╣╠═══╣
   0 ┤║工作║║ 工║║ 工║
     └─────────────────
      周一  周二  周三
```

**交互功能**：
- 鼠标悬浮显示该天各选项的具体时长
- 点击某个日期的柱子，跳转到"录入页面"并定位到该日期

**数据查询逻辑**：
- 同趋势图，但需要按日期聚合所有选项

#### 4.4 维度占比图（环形图）

**功能说明**：
- 展示所选时间范围内各维度选项的占比
- 圆环分段：每个选项一段，使用配置的颜色
- 中心显示：总时长

**图表示例**：
```
       ╔═════════════╗
       ║             ║
       ║   工作 48%  ║
    ╔══╩══╗       ╔══╩══╗
    ║学习  ║ 168.5h║ 生活║
    ║ 30% ║       ║ 22% ║
    ╚═════╝       ╚═════╝
```

**交互功能**：
- 鼠标悬浮显示该选项的具体时长和百分比
- 点击某个扇区，触发"下钻"功能（显示该选项下的二级维度分析）

**数据查询逻辑**：
- 同统计卡片的查询逻辑

---

### 5. 维度下钻功能（核心新增）

#### 5.1 触发方式

**入口**：
- 点击统计卡片
- 点击环形图的某个扇区

**触发对象**：
- 某个具体的维度选项（如："工作"、"TimeTracker"）

#### 5.2 下钻弹窗

**弹窗布局**：
```
┌──────────────────────────────────────────────┐
│ "工作" 详细分析                               │
│ 时长: 80.0h (47.5%)                          │
├──────────────────────────────────────────────┤
│ 按其他维度分析:                               │
│                                              │
│  选择维度: [项目 ▼]                          │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ 📊 项目分布                         │     │
│  │                                    │     │
│  │  TimeTracker  40h  50%   ████████  │     │
│  │  CRM          30h  37.5% ██████    │     │
│  │  装修          10h  12.5% ██        │     │
│  │                                    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ 🎯 事项排行（Top 10）               │     │
│  │                                    │     │
│  │  1. 写代码      20h                │     │
│  │  2. 开会        15h                │     │
│  │  3. 需求评审    10h                │     │
│  │  ...                               │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [ 关闭 ]                                    │
└──────────────────────────────────────────────┘
```

#### 5.3 二级维度分析

**逻辑**：
- 在一级维度的某个选项内，按另一个维度分组统计
- 例如：在"工作"领域内，分析各"项目"的时长分布

**查询 SQL**：
```sql
-- 查询"工作"领域下各项目的时长
SELECT 
  o2.name AS option_name,
  o2.color,
  SUM(te.duration_seconds) / 3600.0 AS hours,
  SUM(te.duration_seconds) * 100.0 / (
    SELECT SUM(te2.duration_seconds)
    FROM time_entries te2
    JOIN entry_attributes ea2 ON te2.id = ea2.entry_id
    WHERE ea2.option_id = ? -- "工作"选项ID
      AND DATE(te2.start_time) BETWEEN ? AND ?
  ) AS percentage
FROM time_entries te
JOIN entry_attributes ea1 ON te.id = ea1.entry_id -- 关联"工作"
JOIN entry_attributes ea2 ON te.id = ea2.entry_id -- 关联其他维度
JOIN dimension_options o2 ON ea2.option_id = o2.id
JOIN dimensions d2 ON o2.dimension_id = d2.id
WHERE ea1.option_id = ? -- "工作"选项ID
  AND d2.id = ? -- 目标维度ID（如"项目"）
  AND DATE(te.start_time) BETWEEN ? AND ?
GROUP BY o2.id
ORDER BY hours DESC;
```

#### 5.4 事项排行

**功能说明**：
- 显示该选项下时长最多的事项（Top 10）

**查询 SQL**：
```sql
SELECT 
  te.title,
  SUM(te.duration_minutes) / 60.0 AS hours
FROM time_entries te
JOIN entry_attributes ea ON te.id = ea.entry_id
WHERE ea.option_id = ? -- 选项ID
  AND DATE(te.start_time) BETWEEN ? AND ?
GROUP BY te.title
ORDER BY hours DESC
LIMIT 10;
```

---

### 6. 数据导出（分析结果）

#### 6.1 导出按钮

**位置**：分析页面右上角

**按钮样式**：
```
[ 📊 导出图表 ▼ ]
```

**下拉菜单**：
- 导出为 PNG（图表截图）
- 导出为 PDF（包含所有图表 + 统计数据）
- 导出为 CSV（原始统计数据）

#### 6.2 导出 CSV 格式

**标准格式（按主维度分组）**：
```csv
维度选项,时长(小时),占比(%),记录数
工作,80.0,47.5,45
学习,50.5,30.0,30
生活,38.0,22.5,25
```

**如果包含二级维度**：
```csv
一级维度,二级维度,时长(小时),占比(%)
工作,TimeTracker,40.0,50.0
工作,CRM,30.0,37.5
工作,装修,10.0,12.5
学习,无,50.5,100.0
```

---

## 技术实现

### 1. 数据查询优化

#### 1.1 主维度统计查询

**查询模板**：
```typescript
async function getStatsGroupedByDimension(
  dimensionId: number,
  dateRange: { start: string; end: string },
  filters?: { [dimensionId: number]: number } // 其他维度的筛选条件
): Promise<StatsResult[]> {
  let sql = `
    SELECT 
      o.id AS option_id,
      o.name AS option_name,
      o.color,
      SUM(te.duration_minutes) / 60.0 AS hours,
      SUM(te.duration_minutes) * 100.0 / (
        SELECT SUM(duration_minutes) 
        FROM time_entries 
        WHERE DATE(start_time) BETWEEN ? AND ?
      ) AS percentage,
      COUNT(DISTINCT te.id) AS entry_count
    FROM time_entries te
    JOIN entry_attributes ea ON te.id = ea.entry_id
    JOIN dimension_options o ON ea.option_id = o.id
    WHERE o.dimension_id = ?
      AND DATE(te.start_time) BETWEEN ? AND ?
  `;
  
  // 添加筛选条件
  if (filters && Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([dimId, optionId]) => {
      sql += `
        AND te.id IN (
          SELECT entry_id FROM entry_attributes WHERE option_id = ?
        )
      `;
    });
  }
  
  sql += `
    GROUP BY o.id
    ORDER BY hours DESC
  `;
  
  const params = [dateRange.start, dateRange.end, dimensionId, dateRange.start, dateRange.end];
  if (filters) {
    params.push(...Object.values(filters));
  }
  
  return await db.all(sql, params);
}
```

#### 1.2 趋势数据查询

**按日期分组**：
```typescript
async function getTrendData(
  dimensionId: number,
  dateRange: { start: string; end: string }
): Promise<TrendData[]> {
  const sql = `
    SELECT 
      DATE(te.start_time) AS date,
      o.id AS option_id,
      o.name AS option_name,
      o.color,
      SUM(te.duration_minutes) / 60.0 AS hours
    FROM time_entries te
    JOIN entry_attributes ea ON te.id = ea.entry_id
    JOIN dimension_options o ON ea.option_id = o.id
    WHERE o.dimension_id = ?
      AND DATE(te.start_time) BETWEEN ? AND ?
    GROUP BY DATE(te.start_time), o.id
    ORDER BY date, o.id
  `;
  
  const results = await db.all(sql, [dimensionId, dateRange.start, dateRange.end]);
  
  // 转换为 Recharts 所需的格式
  return transformToRechartsFormat(results);
}
```

#### 1.3 二级维度查询

**交叉分析**：
```typescript
async function getCrossAnalysis(
  primaryOptionId: number,  // 一级选项ID（如："工作"）
  secondaryDimensionId: number,  // 二级维度ID（如："项目"）
  dateRange: { start: string; end: string }
): Promise<CrossAnalysisResult[]> {
  const sql = `
    SELECT 
      o2.id AS option_id,
      o2.name AS option_name,
      o2.color,
      SUM(te.duration_minutes) / 60.0 AS hours,
      SUM(te.duration_minutes) * 100.0 / (
        SELECT SUM(te2.duration_minutes)
        FROM time_entries te2
        JOIN entry_attributes ea2 ON te2.id = ea2.entry_id
        WHERE ea2.option_id = ?
          AND DATE(te2.start_time) BETWEEN ? AND ?
      ) AS percentage
    FROM time_entries te
    JOIN entry_attributes ea1 ON te.id = ea1.entry_id
    JOIN entry_attributes ea2 ON te.id = ea2.entry_id
    JOIN dimension_options o2 ON ea2.option_id = o2.id
    WHERE ea1.option_id = ?
      AND o2.dimension_id = ?
      AND DATE(te.start_time) BETWEEN ? AND ?
    GROUP BY o2.id
    ORDER BY hours DESC
  `;
  
  return await db.all(sql, [
    primaryOptionId,
    dateRange.start,
    dateRange.end,
    primaryOptionId,
    secondaryDimensionId,
    dateRange.start,
    dateRange.end
  ]);
}
```

### 2. 状态管理（Zustand Store）

**分析状态**：
```typescript
interface AnalysisState {
  // 时间范围
  timeRange: {
    type: 'today' | 'week' | 'month' | 'year' | 'custom';
    start: string;
    end: string;
  };
  
  // 分析维度
  primaryDimension: number | null; // 主维度ID
  filters: { [dimensionId: number]: number | null }; // 筛选条件
  
  // 统计数据
  stats: StatsResult[];
  trendData: TrendData[];
  
  // Loading 状态
  isLoading: boolean;
  
  // Actions
  setTimeRange: (range: TimeRange) => void;
  setPrimaryDimension: (dimensionId: number) => Promise<void>;
  setFilter: (dimensionId: number, optionId: number | null) => Promise<void>;
  loadData: () => Promise<void>;
  drillDown: (optionId: number, secondaryDimensionId: number) => Promise<CrossAnalysisResult[]>;
}
```

### 3. IPC 接口

```typescript
// 获取主维度统计
ipcMain.handle('analysis:get-stats', async (event, options: {
  dimensionId: number;
  dateRange: { start: string; end: string };
  filters?: { [dimensionId: number]: number };
}) => {
  return await getStatsGroupedByDimension(
    options.dimensionId,
    options.dateRange,
    options.filters
  );
});

// 获取趋势数据
ipcMain.handle('analysis:get-trend', async (event, options: {
  dimensionId: number;
  dateRange: { start: string; end: string };
}) => {
  return await getTrendData(options.dimensionId, options.dateRange);
});

// 下钻分析
ipcMain.handle('analysis:drill-down', async (event, options: {
  optionId: number;
  secondaryDimensionId: number;
  dateRange: { start: string; end: string };
}) => {
  return await getCrossAnalysis(
    options.optionId,
    options.secondaryDimensionId,
    options.dateRange
  );
});

// 获取事项排行
ipcMain.handle('analysis:get-top-activities', async (event, options: {
  optionId: number;
  dateRange: { start: string; end: string };
  limit: number;
}) => {
  return await getTopActivities(options.optionId, options.dateRange, options.limit);
});
```

### 4. 图表组件封装

**Recharts 配置示例**：
```typescript
// 趋势图组件
<LineChart data={trendData} width={800} height={400}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis label={{ value: '时长(h)', angle: -90 }} />
  <Tooltip />
  <Legend />
  {dimensions.map(dim => (
    <Line
      key={dim.option_id}
      type="monotone"
      dataKey={dim.option_name}
      stroke={dim.color}
      strokeWidth={2}
    />
  ))}
</LineChart>

// 环形图组件
<PieChart width={400} height={400}>
  <Pie
    data={statsData}
    dataKey="hours"
    nameKey="option_name"
    cx="50%"
    cy="50%"
    innerRadius={80}
    outerRadius={120}
    label
  >
    {statsData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

### 5. 性能优化

#### 5.1 数据缓存

**缓存策略**：
- 缓存 Key：`${dimensionId}_${dateRange.start}_${dateRange.end}_${JSON.stringify(filters)}`
- 缓存时间：5 分钟
- 缓存失效：用户新增/修改/删除记录时清空缓存

#### 5.2 图表延迟加载

**策略**：
- 统计卡片优先加载（< 200ms）
- 图表按顺序依次加载（避免同时渲染 3 个图表卡顿）
- 使用 `React.lazy` + `Suspense` 实现懒加载

#### 5.3 大数据量优化

**数据量阈值**：
- 数据点 < 100：直接渲染
- 数据点 ≥ 100：启用数据抽样（每 N 个点取 1 个）

---

## 验收标准

### 1. 功能验收

| 功能点 | 验收标准 | 优先级 |
|--------|---------|--------|
| 维度切换 | 可选择任意已启用维度作为主维度，统计正确 | P0 |
| 多维度筛选 | 可同时筛选多个维度，数据准确 | P0 |
| 趋势图 | 正确显示各选项的时长变化趋势 | P0 |
| 环形图 | 正确显示各选项的占比 | P0 |
| 下钻功能 | 点击卡片/扇区，正确显示二级维度分析 | P1 |
| 事项排行 | 正确显示 Top 10 事项 | P1 |

### 2. 性能验收

| 指标 | 目标值 | 测试场景 |
|------|--------|---------|
| 统计查询时间 | < 200ms | 查询 10,000 条记录 |
| 图表渲染时间 | < 500ms | 渲染 3 个图表 |
| 维度切换响应 | < 300ms | 切换主维度并刷新数据 |
| 下钻查询时间 | < 300ms | 二级维度交叉分析 |

### 3. 用户体验验收

| 体验指标 | 验收标准 | 测试方法 |
|---------|---------|---------|
| 数据准确性 | 与 Excel 手动统计结果一致 | 对比测试 |
| 界面响应速度 | 无明显卡顿 | 实际使用测试 |
| 图表交互流畅度 | 悬浮提示响应 < 100ms | 交互测试 |

---

## 未来迭代方向

### V3.1 高级分析

1. **时间黑洞识别**
   - 自动识别"摸鱼"时段过多的日子
   - 标记异常时间分配

2. **周期性模式分析**
   - 识别周一到周五的时间分配模式
   - 识别早中晚的时间分配模式

3. **维度相关性分析**
   - 分析"高效"时段主要在做哪些事项
   - 分析不同"项目"的"质量"分布

### V3.2 对比分析

1. **时间段对比**
   - 对比本周 vs 上周的时间分配变化
   - 对比本月 vs 上月

2. **维度选项对比**
   - 对比"高效" vs "摸鱼"时段的事项构成
   - 对比不同"项目"的时长趋势

---

**文档版本**：v3.0
**最后更新**：2026-01-03
**核心变更**：从固定分类分析升级为动态多维度分析，支持维度下钻和交叉分析
