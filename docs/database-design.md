# TimeTracker 数据库设计文档

## 元信息

- **数据库类型**：SQLite 3
- **驱动库**：better-sqlite3
- **存储路径**：`~/Library/Application Support/TimeTracker/timetracker.db`
- **字符编码**：UTF-8
- **创建时间**：2026-01-02
- **当前版本**：v1.0

---

## 设计原则

1. **极简结构**：只设计必要的表，避免过度设计
2. **性能优先**：为高频查询字段建立索引
3. **数据完整性**：通过约束保证数据质量
4. **可扩展性**：预留版本号字段，便于未来迁移

---

## 数据库概览

### 表清单

| 表名 | 用途 | 记录数量级 | 增长速度 |
|------|------|-----------|---------|
| `categories` | 事项分类（工作/生活/学习等） | < 10 条 | 几乎不增长 |
| `time_entries` | 时间段记录 | 现有 6.6 万条 | 年增长 1.3 万条 |

### ER 关系图

```
┌─────────────────┐         ┌──────────────────────┐
│   categories    │ 1     n │    time_entries      │
│─────────────────│◄────────│──────────────────────│
│ id (PK)         │         │ id (PK)              │
│ name            │         │ category_id (FK)     │
│ color           │         │ activity             │
│ sort_order      │         │ start_time           │
│ created_at      │         │ end_time             │
│ updated_at      │         │ duration_minutes     │
└─────────────────┘         │ date                 │
                            │ created_at           │
                            │ updated_at           │
                            └──────────────────────┘
```

---

## 表结构详细设计

### 1. categories（分类表）

**用途**：存储事项分类（工作、生活、学习等），支持用户自定义管理。

#### 字段定义

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | - | 分类唯一标识 |
| `name` | TEXT | NOT NULL UNIQUE | - | 分类名称（如"工作"）<br>最大长度 50 字符 |
| `color` | TEXT | NOT NULL | `#3B82F6` | 分类颜色（十六进制色值）<br>用于图表可视化 |
| `sort_order` | INTEGER | NOT NULL | `0` | 排序权重（越小越靠前）<br>用于下拉列表显示顺序 |
| `is_active` | INTEGER | NOT NULL | `1` | 是否启用（1=启用 0=禁用）<br>软删除标记 |
| `created_at` | TEXT | NOT NULL | `CURRENT_TIMESTAMP` | 创建时间（ISO 8601 格式）|
| `updated_at` | TEXT | NOT NULL | `CURRENT_TIMESTAMP` | 最后更新时间 |

#### 索引

```sql
-- 主键索引（自动创建）
CREATE INDEX idx_categories_id ON categories(id);

-- 排序查询优化
CREATE INDEX idx_categories_sort_order ON categories(sort_order, is_active);
```

#### 初始数据

```sql
INSERT INTO categories (name, color, sort_order) VALUES
  ('工作', '#EF4444', 1),   -- 黄色
  ('生活', '#10B981', 2),   -- 蓝色
  ('学习', '#3B82F6', 3);   -- 绿色
```

#### 业务规则

1. **唯一性**：分类名称不能重复（通过 UNIQUE 约束保证）
2. **软删除**：删除分类时设置 `is_active = 0`，保留历史数据关联
3. **默认分类**：至少保留一个启用的分类（应用层校验）

---

### 2. time_entries（时间段记录表）

**用途**：存储每个时间段的详细记录，包括事项、分类、时间范围等核心数据。

#### 字段定义

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | - | 记录唯一标识 |
| `category_id` | INTEGER | NOT NULL | - | 关联分类 ID<br>外键约束到 `categories.id` |
| `activity` | TEXT | NOT NULL | - | 事项名称（如"开会"）<br>最大长度 200 字符 |
| `start_time` | TEXT | NOT NULL | - | 开始时间（HH:MM 格式，如 "09:30"） |
| `end_time` | TEXT | NOT NULL | - | 结束时间（HH:MM 格式，如 "11:00"） |
| `duration_minutes` | INTEGER | NOT NULL | - | 时长（分钟）<br>冗余字段，便于快速统计 |
| `date` | TEXT | NOT NULL | - | 日期（YYYY-MM-DD 格式）<br>用于按日期查询 |
| `notes` | TEXT | NULL | - | 备注信息（可选）<br>最大长度 500 字符 |
| `created_at` | TEXT | NOT NULL | `CURRENT_TIMESTAMP` | 创建时间（ISO 8601 格式）|
| `updated_at` | TEXT | NOT NULL | `CURRENT_TIMESTAMP` | 最后更新时间 |

#### 索引

```sql
-- 主键索引（自动创建）
CREATE INDEX idx_time_entries_id ON time_entries(id);

-- 按日期查询优化（最高频查询）
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);

-- 按分类统计优化
CREATE INDEX idx_time_entries_category_date ON time_entries(category_id, date);

-- 按事项搜索优化（支持自动补全）
CREATE INDEX idx_time_entries_activity ON time_entries(activity);

-- 复合索引：日期范围 + 分类统计（分析页面核心查询）
CREATE INDEX idx_time_entries_date_category_duration
  ON time_entries(date, category_id, duration_minutes);
```

#### 外键约束

```sql
FOREIGN KEY (category_id) REFERENCES categories(id)
  ON DELETE RESTRICT    -- 禁止删除已被使用的分类
  ON UPDATE CASCADE;    -- 级联更新分类 ID
```

#### 字段计算规则

**duration_minutes 计算逻辑**：
```typescript
// 由应用层在保存前计算
duration_minutes =
  (parseTime(end_time) - parseTime(start_time)) / 60000; // 毫秒转分钟
```

**date 字段填充规则**：
- 使用开始时间的日期部分
- 跨午夜的记录归属于开始日期（如 23:30-01:00 归属 23:30 所在日期）

#### 业务规则

1. **时间合理性**：
   - `end_time` 必须大于 `start_time`（应用层校验）
   - 单次记录时长不超过 24 小时（应用层校验）

2. **时间冲突检测**：
   - 同一日期内，不同记录的时间段不应重叠（应用层警告，不强制阻止）
   - 检测逻辑：
     ```sql
     SELECT COUNT(*) FROM time_entries
     WHERE date = ?
       AND id != ?  -- 排除自身（编辑场景）
       AND (
         (start_time < ? AND end_time > ?)  -- 新记录被包含
         OR (start_time < ? AND end_time > ?)  -- 新记录包含旧记录
         OR (start_time >= ? AND start_time < ?)  -- 开始时间冲突
         OR (end_time > ? AND end_time <= ?)  -- 结束时间冲突
       );
     ```

3. **数据完整性**：
   - 删除分类时，必须先删除或重新分配该分类下的所有时间段记录
   - 软删除分类时，旧记录保持关联，但不能创建新记录

---

## 数据库初始化脚本

### schema.sql

```sql
-- ============================================
-- TimeTracker 数据库表结构
-- 版本：v1.0
-- 创建时间：2026-01-02
-- ============================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================
-- 1. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE CHECK(length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 分类表索引
CREATE INDEX idx_categories_sort_order ON categories(sort_order, is_active);

-- 分类表更新时间触发器
CREATE TRIGGER update_categories_timestamp
AFTER UPDATE ON categories
FOR EACH ROW
BEGIN
  UPDATE categories SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
END;

-- ============================================
-- 2. 时间段记录表
-- ============================================
CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  activity TEXT NOT NULL CHECK(length(activity) <= 200),
  start_time TEXT NOT NULL CHECK(start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  end_time TEXT NOT NULL CHECK(end_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0 AND duration_minutes <= 1440),
  date TEXT NOT NULL CHECK(date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  notes TEXT CHECK(notes IS NULL OR length(notes) <= 500),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- 时间段表索引
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX idx_time_entries_category_date ON time_entries(category_id, date);
CREATE INDEX idx_time_entries_activity ON time_entries(activity);
CREATE INDEX idx_time_entries_date_category_duration
  ON time_entries(date, category_id, duration_minutes);

-- 时间段表更新时间触发器
CREATE TRIGGER update_time_entries_timestamp
AFTER UPDATE ON time_entries
FOR EACH ROW
BEGIN
  UPDATE time_entries SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
END;

-- ============================================
-- 3. 初始化数据
-- ============================================
INSERT INTO categories (name, color, sort_order) VALUES
  ('工作', '#EF4444', 1),
  ('生活', '#10B981', 2),
  ('学习', '#3B82F6', 3);
```

---

## 常用查询示例

### 1. 录入场景

#### 获取所有启用的分类（下拉列表）
```sql
SELECT id, name, color, sort_order
FROM categories
WHERE is_active = 1
ORDER BY sort_order ASC;
```

#### 获取历史事项列表（自动补全）
```sql
SELECT DISTINCT activity
FROM time_entries
WHERE activity LIKE ? || '%'
ORDER BY MAX(created_at) DESC
LIMIT 10;
```

#### 插入新记录
```sql
INSERT INTO time_entries
  (category_id, activity, start_time, end_time, duration_minutes, date)
VALUES (?, ?, ?, ?, ?, ?);
```

#### 检测时间冲突
```sql
SELECT id, activity, start_time, end_time
FROM time_entries
WHERE date = ?
  AND id != ?  -- 编辑时排除自身
  AND (
    (start_time < ? AND end_time > ?)
    OR (start_time < ? AND end_time > ?)
    OR (start_time >= ? AND start_time < ?)
    OR (end_time > ? AND end_time <= ?)
  );
```

### 2. 数据展示

#### 获取某日所有记录（时间倒序）
```sql
SELECT
  te.id,
  te.activity,
  te.start_time,
  te.end_time,
  te.duration_minutes,
  c.name AS category_name,
  c.color AS category_color
FROM time_entries te
INNER JOIN categories c ON te.category_id = c.id
WHERE te.date = ?
ORDER BY te.start_time DESC;
```

#### 按日期范围分页查询
```sql
SELECT
  te.id,
  te.date,
  te.activity,
  te.start_time,
  te.end_time,
  te.duration_minutes,
  c.name AS category_name
FROM time_entries te
INNER JOIN categories c ON te.category_id = c.id
WHERE te.date BETWEEN ? AND ?
ORDER BY te.date DESC, te.start_time DESC
LIMIT ? OFFSET ?;
```

### 3. 数据分析

#### 按分类统计（指定日期范围）
```sql
SELECT
  c.id AS category_id,
  c.name AS category_name,
  c.color AS category_color,
  SUM(te.duration_minutes) AS total_minutes,
  COUNT(te.id) AS entry_count
FROM categories c
LEFT JOIN time_entries te
  ON c.id = te.category_id
  AND te.date BETWEEN ? AND ?
WHERE c.is_active = 1
GROUP BY c.id, c.name, c.color
ORDER BY total_minutes DESC;
```

#### 按日期 + 分类统计（趋势图数据）
```sql
SELECT
  te.date,
  c.id AS category_id,
  c.name AS category_name,
  SUM(te.duration_minutes) AS total_minutes
FROM time_entries te
INNER JOIN categories c ON te.category_id = c.id
WHERE te.date BETWEEN ? AND ?
GROUP BY te.date, c.id, c.name
ORDER BY te.date ASC, c.sort_order ASC;
```

#### 事项时长排行（Top N）
```sql
SELECT
  te.activity,
  SUM(te.duration_minutes) AS total_minutes,
  COUNT(te.id) AS frequency
FROM time_entries te
WHERE te.date BETWEEN ? AND ?
GROUP BY te.activity
ORDER BY total_minutes DESC
LIMIT ?;
```

### 4. Excel 导出

#### 导出全量数据
```sql
SELECT
  te.date AS '日期',
  te.start_time AS '开始时间',
  te.end_time AS '结束时间',
  te.activity AS '事项',
  c.name AS '分类',
  te.duration_minutes AS '时长(分钟)',
  te.notes AS '备注'
FROM time_entries te
INNER JOIN categories c ON te.category_id = c.id
ORDER BY te.date DESC, te.start_time DESC;
```

#### 按日期范围导出
```sql
SELECT
  te.date AS '日期',
  te.start_time AS '开始时间',
  te.end_time AS '结束时间',
  te.activity AS '事项',
  c.name AS '分类',
  te.duration_minutes AS '时长(分钟)'
FROM time_entries te
INNER JOIN categories c ON te.category_id = c.id
WHERE te.date BETWEEN ? AND ?
ORDER BY te.date DESC, te.start_time DESC;
```

---

## 性能优化策略

### 1. 索引优化

**设计思路**：
- 为高频查询字段建立单列索引（`date`）
- 为复杂统计查询建立复合索引（`date + category_id + duration_minutes`）
- 避免过多索引影响写入性能（总共 5 个索引）

**效果评估**：
- 按日期查询：< 5ms（索引扫描）
- 分类统计：< 50ms（复合索引覆盖）
- 事项自动补全：< 10ms（activity 索引）

### 2. 查询优化

**缓存策略**：
- 分类列表：应用启动时加载到内存，变更时更新
- 当日记录：首次查询后缓存，新增/编辑时局部更新
- 统计数据：按日期范围缓存，变更时失效

**批量操作**：
- Excel 导入：使用事务批量插入（每 1000 条提交一次）
- 批量删除：使用 `IN` 子句一次性删除

### 3. 数据清理

**归档策略**（可选，未来实现）：
- 超过 3 年的数据移动到归档表 `time_entries_archive`
- 保持主表数据量在 5 万条以内，确保查询性能

---

## 数据迁移方案

### 版本升级策略

**版本号管理**：
```sql
-- 创建版本管理表
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO schema_version (version) VALUES (1);
```

**迁移脚本示例**（v1 → v2）：
```sql
-- migration_v2.sql
BEGIN TRANSACTION;

-- 示例：新增字段
ALTER TABLE time_entries ADD COLUMN tags TEXT;

-- 更新版本号
INSERT INTO schema_version (version) VALUES (2);

COMMIT;
```

### 数据备份策略

**自动备份**：
- 应用启动时检查上次备份时间
- 超过 7 天自动导出为 Excel（存储在 `~/Documents/TimeTracker/backups/`）

**手动备份**：
- 用户可随时点击"导出 Excel"按钮
- 支持导出到自定义路径

---

## 数据安全

### 1. 防止数据丢失

- **SQLite WAL 模式**：启用 Write-Ahead Logging，提高并发性能和崩溃恢复能力
  ```sql
  PRAGMA journal_mode = WAL;
  ```

- **定期备份**：自动导出 Excel 作为数据快照

### 2. 数据校验

- **CHECK 约束**：在数据库层面限制字段格式（如时间格式、时长范围）
- **外键约束**：防止孤立数据（如删除分类时检查关联记录）
- **应用层校验**：在保存前验证业务规则（如时间冲突检测）

### 3. 并发控制

- **单用户场景**：本地应用无并发写入问题
- **事务保护**：批量操作使用事务保证原子性

---

## 附录

### A. 数据类型说明

| SQLite 类型 | 对应 TypeScript 类型 | 说明 |
|------------|---------------------|------|
| INTEGER | number | 整数 |
| TEXT | string | 字符串（UTF-8） |
| REAL | number | 浮点数（本项目未使用） |

### B. 日期时间格式规范

| 字段类型 | 格式 | 示例 | 说明 |
|---------|------|------|------|
| 日期 | YYYY-MM-DD | 2026-01-02 | ISO 8601 日期部分 |
| 时间 | HH:MM | 14:30 | 24 小时制 |
| 时间戳 | YYYY-MM-DD HH:MM:SS | 2026-01-02 14:30:00 | SQLite 默认格式 |

### C. 颜色规范

- **格式**：十六进制色值（`#RRGGBB`）
- **预设颜色**：
  - 红色：`#EF4444`（Tailwind red-500）
  - 绿色：`#10B981`（Tailwind green-500）
  - 蓝色：`#3B82F6`（Tailwind blue-500）
  - 黄色：`#F59E0B`（Tailwind amber-500）
  - 紫色：`#8B5CF6`（Tailwind violet-500）

---

**文档版本**：v1.0
**最后更新**：2026-01-02
**审核状态**：待用户确认
