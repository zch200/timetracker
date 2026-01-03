-- 1. 维度表
CREATE TABLE IF NOT EXISTS dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. 维度选项表
CREATE TABLE IF NOT EXISTS dimension_options (
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
CREATE TABLE IF NOT EXISTS time_entries (
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
CREATE TABLE IF NOT EXISTS entry_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (entry_id) REFERENCES time_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES dimension_options(id) ON DELETE RESTRICT,
  UNIQUE(entry_id, option_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_time_entries_end_time ON time_entries(end_time);
CREATE INDEX IF NOT EXISTS idx_entry_attributes_entry ON entry_attributes(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_attributes_option ON entry_attributes(option_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_active ON dimensions(is_active);
CREATE INDEX IF NOT EXISTS idx_dimensions_order ON dimensions("order");
CREATE INDEX IF NOT EXISTS idx_options_dimension ON dimension_options(dimension_id);

-- 初始数据：创建默认维度
INSERT OR IGNORE INTO dimensions (id, name, is_active, "order") VALUES
  (1, '领域', 1, 1),
  (2, '项目', 1, 2),
  (3, '质量', 1, 3);

INSERT OR IGNORE INTO dimension_options (dimension_id, name, color, "order") VALUES
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
