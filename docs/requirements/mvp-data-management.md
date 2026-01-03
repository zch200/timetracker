# 数据管理功能（MVP 核心）

---

## 元信息

- **所属系统**：TimeTracker
- **所属模块**：数据管理模块
- **创建时间**：2026-01-02
- **最后更新**：2026-01-03
- **当前版本**：v3.0
- **状态**：规划中
- **负责人**：lok666

---

## 变更历史

| 日期 | 版本 | 变更类型 | 变更内容 | 影响文件 | 变更人 |
|------|------|----------|----------|----------|--------|
| 2026-01-03 | v3.0 | 重构 | 【核心架构变更】<br>1. 新增"维度配置管理"模块（替代原"分类管理"）<br>2. 支持自定义维度（Dimension）+ 选项（Option）体系<br>3. 维度支持启用/禁用功能（适应人生阶段变化）<br>4. Excel 导入/导出适配多维度数据结构<br>5. 新增维度映射配置（用于历史数据导入） | 全部功能描述、数据模型、UI 设计 | lok666 |
| 2026-01-02 | v1.0 | 新增 | 初始版本（固定分类管理 + Excel 导入导出） | 全部 | lok666 |

---

## 业务背景

用户需要以下数据管理能力：
1. **灵活分类体系**：随着人生阶段变化（如学生→职场人→创业者），时间记录的分析维度会改变。传统的固定"分类"无法适应这种变化。
2. **数据备份**：将时间记录数据导出为 Excel，作为数据安全保障（P0 优先级）
3. **历史数据迁移**：将现有 Excel 数据导入到应用中，需要智能映射旧的"分类"到新的多维度体系（P1 优先级）

**核心诉求**：
- **P0（维度管理）**：支持自定义维度和选项，适应需求变化
- **P0（数据导出）**：随时导出数据为 Excel，确保数据不丢失
- **P1（数据导入）**：支持从现有 Excel 导入历史数据，智能映射到多维度

**设计理念**：
- **动态可配置**：维度和选项完全由用户定义，无需硬编码
- **历史数据保留**：禁用维度后，历史数据仍保留，仅在录入时不显示
- **Excel 兼容**：导入导出保持与旧 Excel 格式的兼容性

---

## 核心概念

### 1. 维度（Dimension）

**定义**：一个属性集合的名称，用于描述时间记录的某个方面。

**示例**：
- 领域（Area）：描述时间属于哪个生活领域
- 项目（Project）：描述时间投入到哪个具体项目
- 质量（Quality）：描述时间段的主观质量评价
- 地点（Location）：描述时间在哪里度过（未来扩展）
- 心情（Mood）：描述当时的情绪状态（未来扩展）

**属性**：
- `name`：维度名称
- `is_active`：是否启用（禁用后录入时不显示，但历史数据保留）
- `order`：排序权重（决定录入时的显示顺序）

### 2. 选项（Option）

**定义**：维度下的具体可选值。

**示例**：
- "领域"维度下的选项：工作、学习、生活、娱乐
- "项目"维度下的选项：TimeTracker、CRM、装修、无
- "质量"维度下的选项：高效、正常、摸鱼

**属性**：
- `name`：选项名称
- `dimension_id`：所属维度
- `color`：显示颜色（用于 UI 标识和图表）
- `order`：排序权重

### 3. 数据关联

**一条时间记录可以关联多个选项（来自不同维度）**：

```
时间记录："写代码" 1.5h
关联选项：
  - 领域：工作
  - 项目：TimeTracker
  - 质量：高效
```

**数据结构**：
```
time_entries (时间记录表)
  ↓ 1:N
entry_attributes (关联表)
  ↓ N:1
dimension_options (选项表)
  ↓ N:1
dimensions (维度表)
```

---

## 功能描述

### 1. 维度配置管理（核心新增）

#### 1.1 维度管理界面

**入口位置**：设置页面 → 维度管理

**主界面布局**：
```
┌────────────────────────────────────────────────────────┐
│ ⚙️ 设置 > 维度管理                                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  已启用维度                              [ + 新增维度 ] │
│  ┌──────────────────────────────────────────────┐    │
│  │ 📊 领域                    [↑] [↓] [✏️] [🗑️]  │    │
│  │   ├─ 工作 (#3B82F6)         [✏️] [🗑️]        │    │
│  │   ├─ 学习 (#10B981)         [✏️] [🗑️]        │    │
│  │   ├─ 生活 (#F59E0B)         [✏️] [🗑️]        │    │
│  │   └─ 娱乐 (#EC4899)         [✏️] [🗑️]        │    │
│  │       [ + 添加选项 ]                          │    │
│  ├──────────────────────────────────────────────┤    │
│  │ 📁 项目                    [↑] [↓] [✏️] [🗑️]  │    │
│  │   ├─ TimeTracker (#6366F1)  [✏️] [🗑️]        │    │
│  │   ├─ CRM (#8B5CF6)          [✏️] [🗑️]        │    │
│  │   └─ 无 (#94A3B8)           [✏️] [🗑️]        │    │
│  │       [ + 添加选项 ]                          │    │
│  ├──────────────────────────────────────────────┤    │
│  │ ⭐ 质量                    [↑] [↓] [✏️] [🗑️]  │    │
│  │   ├─ 高效 (#22C55E)         [✏️] [🗑️]        │    │
│  │   ├─ 正常 (#A3A3A3)         [✏️] [🗑️]        │    │
│  │   └─ 摸鱼 (#EF4444)         [✏️] [🗑️]        │    │
│  │       [ + 添加选项 ]                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  已禁用维度                                             │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🎓 备考科目                                   │    │
│  │    (禁用于 2025-12-01)        [启用] [删除]  │    │
│  │    历史数据：120 条记录                       │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 1.2 新增维度

**点击"+ 新增维度"按钮**，弹出创建弹窗：

```
┌────────────────────────────────────┐
│ 新增维度                            │
├────────────────────────────────────┤
│ 维度名称:                           │
│  [项目__________]                  │
│                                    │
│ 是否启用:                           │
│  ☑ 启用（在录入时显示）             │
│                                    │
│ 初始选项（可选）:                   │
│  [TimeTracker___] [添加]           │
│  [CRM___________] [添加]           │
│                                    │
│  已添加:                            │
│  - TimeTracker [删除]              │
│  - CRM [删除]                      │
│                                    │
│  [ 取消 ]         [ 创建 (Cmd+S) ] │
└────────────────────────────────────┘
```

**字段说明**：
- **维度名称**：必填，2-10 个字符
- **是否启用**：默认勾选，如果不勾选则创建后直接进入"已禁用"列表
- **初始选项**：可选，方便创建维度时同时添加常用选项

**验证规则**：
- 维度名称不能重复（包括已禁用的维度）
- 维度名称不能为空

#### 1.3 编辑维度

**点击维度卡片右侧的"✏️"按钮**，弹出编辑弹窗：

```
┌────────────────────────────────────┐
│ 编辑维度                            │
├────────────────────────────────────┤
│ 维度名称:                           │
│  [领域__________]                  │
│                                    │
│ 排序权重:                           │
│  [1__] (数字越小越靠前)            │
│                                    │
│  [ 取消 ]         [ 保存 (Cmd+S) ] │
└────────────────────────────────────┘
```

**可修改内容**：
- 维度名称
- 排序权重

**不可修改**：
- 维度 ID（用于数据关联，不可改）
- 启用状态（需通过"禁用"按钮操作）

#### 1.4 禁用/启用维度

**禁用操作**：
1. 点击维度卡片右侧的"[↓]"按钮（或下拉菜单中的"禁用"）
2. 弹出确认提示：
   ```
   ⚠️ 确认禁用维度 "备考科目"？
   
   禁用后：
   - 录入时不再显示此维度
   - 历史数据仍保留（120 条记录）
   - 可随时重新启用
   
   [ 取消 ]  [ 确认禁用 ]
   ```
3. 确认后，维度移至"已禁用"列表

**启用操作**：
1. 在"已禁用"列表中点击"[启用]"按钮
2. 维度立即移回"已启用"列表

#### 1.5 删除维度

**删除条件**：
- 只能删除"已禁用"且**没有关联历史数据**的维度
- 如果有历史数据，显示警告：
  ```
  ⚠️ 无法删除维度 "备考科目"
  
  该维度关联了 120 条历史记录。
  
  建议操作：
  - 保持禁用状态（不影响录入）
  - 如需删除，请先删除相关历史记录
  
  [ 知道了 ]
  ```

**删除流程**：
1. 点击"[删除]"按钮
2. 弹出二次确认：
   ```
   ⚠️ 确认删除维度 "测试维度"？
   
   此操作不可恢复！
   
   [ 取消 ]  [ 确认删除 ]
   ```
3. 确认后，从数据库中物理删除

---

### 2. 选项管理

#### 2.1 添加选项

**点击维度卡片下方的"[ + 添加选项 ]"按钮**，展开内联输入框：

```
│ 📊 领域                    [↑] [↓] [✏️] [🗑️]  │
│   ├─ 工作 (#3B82F6)         [✏️] [🗑️]        │
│   ├─ 学习 (#10B981)         [✏️] [🗑️]        │
│   └─ 生活 (#F59E0B)         [✏️] [🗑️]        │
│                                              │
│   ┌────────────────────────────────┐        │
│   │ [娱乐_______]  🎨[#EC4899▼] ✓ │        │
│   └────────────────────────────────┘        │
```

**字段说明**：
- **选项名称**：2-20 个字符
- **颜色选择器**：点击色块弹出颜色选择器
- **✓**：确认按钮

**验证规则**：
- 选项名称不能与同维度下其他选项重复
- 颜色必须选择

**快捷操作**：
- 输入名称后按 Enter 自动确认（使用系统默认颜色）

#### 2.2 编辑选项

**点击选项右侧的"✏️"按钮**，弹出编辑弹窗：

```
┌────────────────────────────────────┐
│ 编辑选项                            │
├────────────────────────────────────┤
│ 选项名称:                           │
│  [工作__________]                  │
│                                    │
│ 显示颜色:                           │
│  🎨 [#3B82F6]   [选择颜色]         │
│  预览: ⬤ 工作                      │
│                                    │
│ 排序权重:                           │
│  [1__] (数字越小越靠前)            │
│                                    │
│  [ 取消 ]         [ 保存 (Cmd+S) ] │
└────────────────────────────────────┘
```

#### 2.3 删除选项

**删除条件**：
- 如果选项关联了历史数据，不允许删除
- 显示关联数据数量，建议保留

**删除流程**：
1. 点击选项右侧的"🗑️"按钮
2. 如果有关联数据：
   ```
   ⚠️ 无法删除选项 "工作"
   
   该选项关联了 1,234 条历史记录。
   
   建议操作：
   - 保留此选项
   - 如需清理，请先删除相关记录

  [ 知道了 ]
  ```
3. 如果无关联数据，弹出确认：
   ```
   确认删除选项 "测试"？
   
   [ 取消 ]  [ 删除 ]
   ```

---

### 3. 预设维度方案（首次使用引导）

#### 3.1 首次使用场景

**用户首次打开应用**，数据库中没有任何维度，弹出引导弹窗：

```
┌────────────────────────────────────────────┐
│ 👋 欢迎使用 TimeTracker                    │
├────────────────────────────────────────────┤
│ 为了更好地分析时间，请先配置分类维度。      │
│                                            │
│ 你可以选择预设方案，或稍后自定义：          │
│                                            │
│  ● 标准方案（推荐）                         │
│    维度: 领域、项目、质量                   │
│    适合大多数场景                           │
│                                            │
│  ○ 极简方案                                │
│    维度: 领域                               │
│    只记录基本分类                           │
│                                            │
│  ○ 自定义                                  │
│    手动创建维度                             │
│                                            │
│  [ 稍后配置 ]              [ 开始使用 ]     │
└────────────────────────────────────────────┘
```

#### 3.2 预设方案详情

**标准方案**：
```
维度1：领域
  - 工作 (#3B82F6)
  - 学习 (#10B981)
  - 生活 (#F59E0B)
  - 娱乐 (#EC4899)

维度2：项目
  - 无 (#94A3B8)

维度3：质量
  - 高效 (#22C55E)
  - 正常 (#A3A3A3)
  - 摸鱼 (#EF4444)
```

**极简方案**：
```
维度1：领域
  - 工作 (#3B82F6)
  - 生活 (#F59E0B)
```

**用户选择"开始使用"后**：
- 自动创建对应的维度和选项
- 跳转到录入页面
- 显示使用提示（Tooltip）

---

### 4. Excel 数据导出（适配多维度）

#### 4.1 导出入口

**位置**：
- 主界面顶部菜单栏："文件" → "导出 Excel"
- 设置页面："数据管理" → "导出数据"按钮
- 快捷键：`Cmd+E`

#### 4.2 导出配置

**导出范围选择**：
```
┌───────────────────────────────────────┐
│ 导出 Excel 数据                        │
├───────────────────────────────────────┤
│ 导出范围：                             │
│  ○ 全部数据                            │
│  ● 按日期范围                          │
│    [2019-01-01] ~ [2026-01-03]        │
│                                       │
│ 维度筛选（可选）：                     │
│  领域:  ☑ 工作  ☑ 学习  ☑ 生活       │
│  项目:  ☑ TimeTracker  ☑ CRM         │
│  质量:  ☐ 全部                        │
│                                       │
│ 导出格式：                             │
│  ● 标准格式（多列展开维度）            │
│  ○ 紧凑格式（维度合并到一列）          │
│                                       │
│ [ 取消 ]           [ 导出 (Cmd+S) ]   │
└───────────────────────────────────────┘
```

#### 4.3 Excel 表结构（标准格式）

**多维度展开为独立列**：

| 日期 | 开始时间 | 结束时间 | 事项 | 时长(分钟) | 领域 | 项目 | 质量 | 备注 |
|------|---------|---------|------|-----------|------|------|------|------|
| 2026-01-03 | 14:30 | 16:00 | 写代码 | 90 | 工作 | TimeTracker | 高效 | 完成登录模块 |
| 2026-01-03 | 12:30 | 14:30 | 午餐 | 120 | 生活 | 无 | 正常 | |

**列说明**：
- 固定列：日期、开始时间、结束时间、事项、时长(分钟)、备注
- 动态列：根据当前已启用的维度动态生成列名

#### 4.4 Excel 表结构（紧凑格式）

**维度合并为一列**：

| 日期 | 开始时间 | 结束时间 | 事项 | 时长(分钟) | 标签 | 备注 |
|------|---------|---------|------|-----------|------|------|
| 2026-01-03 | 14:30 | 16:00 | 写代码 | 90 | 工作\|TimeTracker\|高效 | 完成登录模块 |
| 2026-01-03 | 12:30 | 14:30 | 午餐 | 120 | 生活\|无\|正常 | |

**格式说明**：
- 标签列使用 `|` 分隔不同维度的选项
- 顺序：按维度的 `order` 字段排序

#### 4.5 导出流程

```
1. 用户点击"导出 Excel"
   ↓
2. 弹出配置弹窗
   ↓
3. 用户选择导出范围、筛选条件、格式
   ↓
4. 点击"导出"按钮
   ↓
5. 系统文件保存对话框
   ↓
6. 用户选择保存路径和文件名
   ↓
7. 生成 .xlsx 文件
   - 使用 exceljs 库
   - 应用基础样式（表头加粗、冻结首行）
   ↓
8. 显示成功提示：
   "✅ 导出成功！共导出 1,234 条记录"
   [ 打开文件 ]  [ 打开文件夹 ]  [ 关闭 ]
```

**文件名规则**：
- 格式：`TimeTracker_导出_{日期范围}.xlsx`
- 示例：`TimeTracker_导出_20190101-20260103.xlsx`
- 全部数据：`TimeTracker_导出_全部.xlsx`

#### 4.6 导出性能优化

**大数据量处理**：
- 数据量 < 10,000 条：直接导出
- 数据量 ≥ 10,000 条：
  - 显示进度条
  - 分批写入（每批 1,000 条）
  - 允许取消操作

---

### 5. Excel 数据导入（适配多维度）

#### 5.1 导入入口

**位置**：
- 设置页面："数据管理" → "导入 Excel"按钮
- 首次使用引导弹窗："导入历史数据"选项

#### 5.2 导入流程概览

```
1. 选择 Excel 文件
   ↓
2. 系统解析文件结构
   ↓
3. 智能检测列映射
   ↓
4. 用户确认/调整映射关系
   ↓
5. 预览导入结果（前 10 条）
   ↓
6. 执行导入（显示进度）
   ↓
7. 显示导入报告
```

#### 5.3 文件结构解析

**系统自动识别以下列**：
- 必需列：日期、开始时间、结束时间、事项
- 可选列：备注、分类相关列

**解析逻辑**：
```typescript
function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  headers.forEach((header, index) => {
    // 精确匹配
    if (header === '日期') mapping.date = index;
    if (header === '开始时间') mapping.startTime = index;
    if (header === '结束时间') mapping.endTime = index;
    if (header === '事项') mapping.title = index;
    if (header === '备注') mapping.description = index;
    
    // 模糊匹配（兼容不同版本）
    if (header.includes('时长')) mapping.duration = index;
    if (header.includes('分类')) mapping.category = index;
  });
  
  return mapping;
}
```

#### 5.4 维度映射配置

**场景**：用户从旧 Excel 导入，Excel 中有"分类"列，需要映射到新的多维度体系。

**映射界面**：
```
┌────────────────────────────────────────────┐
│ 配置列映射                                  │
├────────────────────────────────────────────┤
│ Excel 列         →   系统字段              │
├────────────────────────────────────────────┤
│ 日期             →   日期         ✓        │
│ 开始时间          →   开始时间     ✓        │
│ 结束时间          →   结束时间     ✓        │
│ 事项             →   事项名称      ✓        │
│ 分类             →   [需要配置] ⚠️         │
│ 备注             →   备注          ✓        │
├────────────────────────────────────────────┤
│ "分类" 列映射设置：                         │
│                                            │
│  Excel 值        →   维度: 领域           │
│  ────────────────────────────────          │
│  工作            →   工作 ✓               │
│  学习            →   学习 ✓               │
│  生活            →   生活 ✓               │
│  娱乐            →   娱乐 ✓               │
│                                            │
│  💡 系统已自动匹配，请确认或调整            │
│                                            │
│  [ 上一步 ]                [ 下一步 ]      │
└────────────────────────────────────────────┘
```

**智能匹配逻辑**：
1. 检测 Excel 中"分类"列的唯一值（如：工作、学习、生活）
2. 在当前维度中查找同名选项
3. 如果找到，自动建立映射关系
4. 如果找不到，提示用户选择或新建

**手动调整**：
- 点击映射关系右侧的下拉框
- 选择目标维度和选项
- 或选择"创建新选项"

#### 5.5 预览与确认

**预览界面**：
```
┌────────────────────────────────────────────┐
│ 导入预览（前 10 条）                        │
├────────────────────────────────────────────┤
│ ✓ 2026-01-03 14:30-16:00 写代码            │
│   [领域:工作] [项目:无] [质量:正常]         │
│                                            │
│ ✓ 2026-01-03 12:30-14:30 午餐              │
│   [领域:生活] [项目:无] [质量:正常]         │
│                                            │
│ ⚠️ 2026-01-03 09:00-12:00 开会             │
│   时间段与现有记录冲突                      │
│                                            │
│ ❌ 2026-01-02 (日期格式错误)               │
│   无法解析日期                              │
├────────────────────────────────────────────┤
│ 统计：                                      │
│  - 成功: 1,200 条                          │
│  - 警告: 5 条（时间冲突）                   │
│  - 错误: 2 条（格式错误）                   │
│                                            │
│  [ 下载错误日志 ]                          │
│  [ 上一步 ]              [ 开始导入 ]      │
└────────────────────────────────────────────┘
```

**处理策略选项**：
- **时间冲突**：
  - ○ 跳过冲突记录
  - ● 保留所有记录（允许时间重叠）
- **格式错误**：
  - 自动跳过

#### 5.6 执行导入

**进度界面**：
```
┌────────────────────────────────────────────┐
│ 正在导入...                                │
├────────────────────────────────────────────┤
│ ████████████████░░░░░░░░░░░░  62%         │
│                                            │
│ 已处理: 750 / 1,200 条                     │
│ 预计剩余时间: 15 秒                         │
│                                            │
│  [ 取消导入 ]                              │
└────────────────────────────────────────────┘
```

**导入报告**：
```
┌────────────────────────────────────────────┐
│ ✅ 导入完成                                │
├────────────────────────────────────────────┤
│ 成功导入: 1,198 条记录                     │
│ 跳过冲突: 5 条                             │
│ 格式错误: 2 条                             │
│                                            │
│ 导入时间: 2026-01-03 15:30:00              │
│                                            │
│  [ 查看错误日志 ]        [ 完成 ]          │
└────────────────────────────────────────────┘
```

---

### 6. 数据库备份提醒

#### 6.1 自动备份提醒

**触发条件**：
- 每月 1 号首次打开应用时弹出
- 或距离上次导出超过 30 天

**提醒弹窗**：
```
┌────────────────────────────────────────────┐
│ 💾 数据备份提醒                            │
├────────────────────────────────────────────┤
│ 已有 30 天未备份数据。                     │
│                                            │
│ 为了保障数据安全，建议立即导出 Excel。     │
│                                            │
│ 当前记录数: 1,234 条                       │
│ 上次备份: 2025-12-03                       │
│                                            │
│  [ 稍后提醒 ]        [ 立即导出 ]          │
└────────────────────────────────────────────┘
```

**"立即导出"操作**：
- 直接打开导出配置弹窗
- 默认选择"全部数据"
- 文件名自动填充为 `TimeTracker_备份_YYYYMMDD.xlsx`

---

## 技术实现

### 1. 数据模型

#### 1.1 维度表（dimensions）

```sql
CREATE TABLE dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_dimensions_active ON dimensions(is_active);
CREATE INDEX idx_dimensions_order ON dimensions("order");
```

#### 1.2 维度选项表（dimension_options）

```sql
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

CREATE INDEX idx_options_dimension ON dimension_options(dimension_id);
CREATE INDEX idx_options_order ON dimension_options("order");
```

#### 1.3 记录-选项关联表（entry_attributes）

```sql
CREATE TABLE entry_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (entry_id) REFERENCES time_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES dimension_options(id) ON DELETE RESTRICT,
  UNIQUE(entry_id, option_id)
);

CREATE INDEX idx_entry_attrs_entry ON entry_attributes(entry_id);
CREATE INDEX idx_entry_attrs_option ON entry_attributes(option_id);
```

**设计说明**：
- **时间格式统一**：所有时间字段使用 TEXT 类型存储 ISO 8601 格式（如 `2026-01-03T09:00:15`）
- **外键约束**：`option_id` 使用 `ON DELETE RESTRICT` 防止删除有历史数据的选项；`entry_id` 使用 `ON DELETE CASCADE` 删除记录时自动删除关联
- **更新策略**：编辑记录的维度选项时，采用"先删后插"方案（在事务中删除该记录的所有旧关联，再批量插入新关联）

### 2. IPC 接口设计

#### 2.1 维度管理接口

```typescript
// 获取所有维度（包含选项）
ipcMain.handle('dimensions:list', async () => {
  return await db.all(`
    SELECT
      d.*,
      (SELECT COUNT(*) FROM entry_attributes ea 
       JOIN dimension_options o ON ea.option_id = o.id 
       WHERE o.dimension_id = d.id) as usage_count
    FROM dimensions d
    ORDER BY d.is_active DESC, d.order ASC
  `);
});

// 创建维度
ipcMain.handle('dimensions:create', async (event, data: {
  name: string;
  is_active: boolean;
  options?: { name: string; color: string }[];
}) => {
  const db = getDatabase();
  const transaction = db.transaction((data) => {
    // 1. 创建维度
    const result = db.prepare(`
      INSERT INTO dimensions (name, is_active, order)
      VALUES (?, ?, (SELECT COALESCE(MAX(order), 0) + 1 FROM dimensions))
    `).run(data.name, data.is_active);
    
    const dimensionId = result.lastInsertRowid;
    
    // 2. 创建初始选项
    if (data.options && data.options.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO dimension_options (dimension_id, name, color, order)
        VALUES (?, ?, ?, ?)
      `);
      
      data.options.forEach((opt, index) => {
        stmt.run(dimensionId, opt.name, opt.color, index);
      });
    }
    
    return dimensionId;
  });
  
  return transaction(data);
});

// 更新维度
ipcMain.handle('dimensions:update', async (event, id: number, data: {
  name?: string;
  order?: number;
}) => {
  // 更新逻辑
});

// 切换维度启用状态
ipcMain.handle('dimensions:toggle-active', async (event, id: number) => {
  return await db.prepare(`
    UPDATE dimensions 
    SET is_active = NOT is_active,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);
});

// 删除维度（需检查使用情况）
ipcMain.handle('dimensions:delete', async (event, id: number) => {
  // 1. 检查是否有关联数据
  const usage = await db.get(`
    SELECT COUNT(*) as count
    FROM entry_attributes ea
    JOIN dimension_options o ON ea.option_id = o.id
    WHERE o.dimension_id = ?
  `, id);
  
  if (usage.count > 0) {
    throw new Error(`无法删除，该维度关联了 ${usage.count} 条记录`);
  }
  
  // 2. 删除维度（会级联删除选项）
  return await db.prepare('DELETE FROM dimensions WHERE id = ?').run(id);
});
```

#### 2.2 选项管理接口

```typescript
// 获取维度下的所有选项
ipcMain.handle('options:list', async (event, dimensionId: number) => {
  return await db.all(`
    SELECT 
      o.*,
      (SELECT COUNT(*) FROM entry_attributes WHERE option_id = o.id) as usage_count
    FROM dimension_options o
    WHERE o.dimension_id = ?
    ORDER BY o.order ASC
  `, dimensionId);
});

// 创建选项
ipcMain.handle('options:create', async (event, data: {
  dimension_id: number;
  name: string;
  color: string;
}) => {
  return await db.prepare(`
    INSERT INTO dimension_options (dimension_id, name, color, order)
    VALUES (?, ?, ?, (
      SELECT COALESCE(MAX(order), 0) + 1 
      FROM dimension_options 
      WHERE dimension_id = ?
    ))
  `).run(data.dimension_id, data.name, data.color, data.dimension_id);
});

// 更新选项
ipcMain.handle('options:update', async (event, id: number, data: {
  name?: string;
  color?: string;
  order?: number;
}) => {
  // 更新逻辑
});

// 删除选项（需检查使用情况）
ipcMain.handle('options:delete', async (event, id: number) => {
  // 检查 + 删除逻辑（同维度删除）
});
```

#### 2.3 Excel 导入导出接口

```typescript
// 导出 Excel
ipcMain.handle('excel:export', async (event, options: {
  dateRange?: { start: string; end: string };
  dimensions?: { [dimensionId: number]: number[] }; // 维度 ID -> 选项 IDs
  format: 'standard' | 'compact';
}) => {
  // 1. 查询数据
  const entries = await queryEntriesWithFilters(options);
  
  // 2. 获取所有已启用维度
  const dimensions = await db.all(`
    SELECT * FROM dimensions WHERE is_active = 1 ORDER BY order
  `);
  
  // 3. 生成 Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('时间记录');
  
  // 4. 根据格式类型生成列
  if (options.format === 'standard') {
    // 标准格式：每个维度一列
    const columns = [
      { header: '日期', key: 'date', width: 12 },
      { header: '开始时间', key: 'start_time', width: 10 },
      { header: '结束时间', key: 'end_time', width: 10 },
      { header: '事项', key: 'title', width: 20 },
      { header: '时长(分钟)', key: 'duration', width: 12 },
    ];
    
    // 动态添加维度列
    dimensions.forEach(dim => {
      columns.push({ header: dim.name, key: `dim_${dim.id}`, width: 15 });
    });
    
    columns.push({ header: '备注', key: 'description', width: 30 });
    worksheet.columns = columns;
  } else {
    // 紧凑格式：所有维度合并到一列
    worksheet.columns = [
      { header: '日期', key: 'date', width: 12 },
      { header: '开始时间', key: 'start_time', width: 10 },
      { header: '结束时间', key: 'end_time', width: 10 },
      { header: '事项', key: 'title', width: 20 },
      { header: '时长(分钟)', key: 'duration', width: 12 },
      { header: '标签', key: 'tags', width: 30 },
      { header: '备注', key: 'description', width: 30 },
    ];
  }
  
  // 5. 填充数据
  entries.forEach(entry => {
    const row: any = {
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      title: entry.title,
      duration: entry.duration_minutes,
      description: entry.description || '',
    };
    
    // 填充维度数据
    if (options.format === 'standard') {
      entry.dimensions.forEach(dim => {
        row[`dim_${dim.dimension_id}`] = dim.option_name;
      });
    } else {
      row.tags = entry.dimensions.map(d => d.option_name).join('|');
    }
    
    worksheet.addRow(row);
  });
  
  // 6. 应用样式
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
  // 7. 保存文件
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
});

// 导入 Excel
ipcMain.handle('excel:import', async (event, options: {
  filePath: string;
  columnMapping: ColumnMapping;
  dimensionMapping: { [excelColumn: string]: { dimensionId: number; valueMap: { [excelValue: string]: number } } };
  conflictStrategy: 'skip' | 'keep-all';
}) => {
  // 1. 读取 Excel 文件
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(options.filePath);
  const worksheet = workbook.worksheets[0];
  
  // 2. 解析数据
  const results = {
    success: 0,
    warning: 0,
    error: 0,
    errors: [] as string[],
  };
  
  const transaction = db.transaction((rows) => {
    rows.forEach((row, index) => {
      try {
        // 解析时间、事项等
        // 检测冲突
        // 插入记录 + 关联维度
        results.success++;
      } catch (error) {
        results.error++;
        results.errors.push(`第 ${index + 2} 行: ${error.message}`);
      }
    });
  });
  
  transaction(parsedRows);
  
  return results;
});
```

### 3. 性能优化

#### 3.1 数据库查询优化

**获取记录时同时加载维度**（避免 N+1 查询）：
```sql
SELECT 
  te.*,
  GROUP_CONCAT(
    d.id || ':' || d.name || ':' || o.id || ':' || o.name || ':' || o.color,
    '||'
  ) as dimensions_data
FROM time_entries te
LEFT JOIN entry_attributes ea ON te.id = ea.entry_id
LEFT JOIN dimension_options o ON ea.option_id = o.id
LEFT JOIN dimensions d ON o.dimension_id = d.id
WHERE DATE(te.start_time) = ?
GROUP BY te.id
ORDER BY te.start_time DESC;
```

#### 3.2 缓存策略

**维度配置缓存**：
- 应用启动时加载所有维度和选项到内存
- 维度修改时更新缓存
- 避免每次录入时查询数据库

---

## 验收标准

### 1. 功能验收

| 功能点 | 验收标准 | 优先级 |
|--------|---------|--------|
| 维度管理 | 可创建、编辑、删除、启用/禁用维度 | P0 |
| 选项管理 | 可为维度添加、编辑、删除选项 | P0 |
| 历史数据保护 | 禁用维度后历史数据仍可查看 | P0 |
| Excel 导出 | 正确导出多维度数据（标准 + 紧凑格式） | P0 |
| Excel 导入 | 支持旧数据映射到多维度，准确率 100% | P1 |
| 预设方案 | 首次使用可选择预设方案，快速开始 | P1 |

### 2. 性能验收

| 指标 | 目标值 | 测试场景 |
|------|--------|---------|
| 维度加载时间 | < 50ms | 加载所有维度和选项 |
| Excel 导出速度 | < 5s | 导出 10,000 条记录 |
| Excel 导入速度 | < 10s | 导入 10,000 条记录 |

---

**文档版本**：v3.0
**最后更新**：2026-01-03
**核心变更**：引入动态多维分类系统，替代固定分类字段
