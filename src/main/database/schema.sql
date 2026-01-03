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
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order, is_active);

-- 分类表更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_categories_timestamp
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
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_category_date ON time_entries(category_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_activity ON time_entries(activity);
CREATE INDEX IF NOT EXISTS idx_time_entries_date_category_duration
  ON time_entries(date, category_id, duration_minutes);

-- 时间段表更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_time_entries_timestamp
AFTER UPDATE ON time_entries
FOR EACH ROW
BEGIN
  UPDATE time_entries SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
END;

-- ============================================
-- 3. 初始化数据
-- ============================================
INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES
  ('工作', '#EF4444', 1),
  ('生活', '#10B981', 2),
  ('学习', '#3B82F6', 3);

