import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { join } from "path";
import Database from "better-sqlite3";
import ExcelJS from "exceljs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const schema = "-- ============================================\n-- TimeTracker 数据库表结构\n-- 版本：v1.0\n-- 创建时间：2026-01-02\n-- ============================================\n\n-- 启用外键约束\nPRAGMA foreign_keys = ON;\n\n-- ============================================\n-- 1. 分类表\n-- ============================================\nCREATE TABLE IF NOT EXISTS categories (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL UNIQUE CHECK(length(name) <= 50),\n  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),\n  sort_order INTEGER NOT NULL DEFAULT 0,\n  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),\n  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),\n  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))\n);\n\n-- 分类表索引\nCREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order, is_active);\n\n-- 分类表更新时间触发器\nCREATE TRIGGER IF NOT EXISTS update_categories_timestamp\nAFTER UPDATE ON categories\nFOR EACH ROW\nBEGIN\n  UPDATE categories SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;\nEND;\n\n-- ============================================\n-- 2. 时间段记录表\n-- ============================================\nCREATE TABLE IF NOT EXISTS time_entries (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  category_id INTEGER NOT NULL,\n  activity TEXT NOT NULL CHECK(length(activity) <= 200),\n  start_time TEXT NOT NULL CHECK(start_time GLOB '[0-2][0-9]:[0-5][0-9]'),\n  end_time TEXT NOT NULL CHECK(end_time GLOB '[0-2][0-9]:[0-5][0-9]'),\n  duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0 AND duration_minutes <= 1440),\n  date TEXT NOT NULL CHECK(date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),\n  notes TEXT CHECK(notes IS NULL OR length(notes) <= 500),\n  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),\n  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),\n  FOREIGN KEY (category_id) REFERENCES categories(id)\n    ON DELETE RESTRICT\n    ON UPDATE CASCADE\n);\n\n-- 时间段表索引\nCREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date DESC);\nCREATE INDEX IF NOT EXISTS idx_time_entries_category_date ON time_entries(category_id, date);\nCREATE INDEX IF NOT EXISTS idx_time_entries_activity ON time_entries(activity);\nCREATE INDEX IF NOT EXISTS idx_time_entries_date_category_duration\n  ON time_entries(date, category_id, duration_minutes);\n\n-- 时间段表更新时间触发器\nCREATE TRIGGER IF NOT EXISTS update_time_entries_timestamp\nAFTER UPDATE ON time_entries\nFOR EACH ROW\nBEGIN\n  UPDATE time_entries SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;\nEND;\n\n-- ============================================\n-- 3. 初始化数据\n-- ============================================\nINSERT OR IGNORE INTO categories (name, color, sort_order) VALUES\n  ('工作', '#EF4444', 1),\n  ('生活', '#10B981', 2),\n  ('学习', '#3B82F6', 3);\n\n";
class TimeTrackerDatabase {
  db = null;
  static instance = null;
  constructor() {
    this.initialize();
  }
  static getInstance() {
    if (!TimeTrackerDatabase.instance) {
      TimeTrackerDatabase.instance = new TimeTrackerDatabase();
    }
    return TimeTrackerDatabase.instance;
  }
  initialize() {
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, "timetracker.db");
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    this.createTables();
  }
  createTables() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    this.db.exec(schema);
  }
  getDatabase() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      TimeTrackerDatabase.instance = null;
    }
  }
}
function getDatabase() {
  return TimeTrackerDatabase.getInstance().getDatabase();
}
ipcMain.handle("test:ping", async () => {
  return { success: true, message: "pong" };
});
ipcMain.handle("categories:getAll", async () => {
  try {
    const db = getDatabase();
    const categories = db.prepare(
      `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.sort_order,
        c.is_active,
        COALESCE(COUNT(te.id), 0) AS entry_count
      FROM categories c
      LEFT JOIN time_entries te ON c.id = te.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.color, c.sort_order, c.is_active
      ORDER BY c.sort_order ASC
    `
    ).all();
    return categories;
  } catch (error) {
    return {
      error: error.message || "获取分类列表失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "categories:create",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { name, color } = params;
      const existing = db.prepare("SELECT id FROM categories WHERE name = ? AND is_active = 1").get(name);
      if (existing) {
        return {
          error: "分类名称已存在",
          code: "DUPLICATE_NAME"
        };
      }
      const maxOrder = db.prepare("SELECT MAX(sort_order) AS max_order FROM categories").get();
      const sortOrder = (maxOrder.max_order ?? 0) + 1;
      const result = db.prepare(
        "INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)"
      ).run(name, color, sortOrder);
      return {
        success: true,
        id: Number(result.lastInsertRowid)
      };
    } catch (error) {
      return {
        error: error.message || "创建分类失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "categories:update",
  async (_event, id, params) => {
    try {
      const db = getDatabase();
      const { name, color } = params;
      if (name) {
        const existing = db.prepare(
          "SELECT id FROM categories WHERE name = ? AND id != ? AND is_active = 1"
        ).get(name, id);
        if (existing) {
          return {
            error: "分类名称已存在",
            code: "DUPLICATE_NAME"
          };
        }
      }
      const updates = [];
      const values = [];
      if (name) {
        updates.push("name = ?");
        values.push(name);
      }
      if (color) {
        updates.push("color = ?");
        values.push(color);
      }
      if (updates.length === 0) {
        return { success: true };
      }
      values.push(id);
      const sql = `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`;
      db.prepare(sql).run(...values);
      return { success: true };
    } catch (error) {
      return {
        error: error.message || "更新分类失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle("categories:delete", async (_event, id) => {
  try {
    const db = getDatabase();
    const activeCount = db.prepare("SELECT COUNT(*) AS count FROM categories WHERE is_active = 1").get();
    if (activeCount.count <= 1) {
      return {
        error: "至少需要保留一个分类",
        code: "LAST_CATEGORY"
      };
    }
    const entryCount = db.prepare("SELECT COUNT(*) AS count FROM time_entries WHERE category_id = ?").get(id);
    if (entryCount.count > 0) {
      return {
        error: `该分类下有 ${entryCount.count} 条记录，无法删除`,
        code: "HAS_ENTRIES"
      };
    }
    db.prepare("UPDATE categories SET is_active = 0 WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "删除分类失败",
      code: "DB_ERROR"
    };
  }
});
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}
ipcMain.handle("timeEntries:getByDate", async (_event, date) => {
  try {
    const db = getDatabase();
    const entries = db.prepare(
      `
      SELECT
        te.id,
        te.activity,
        te.start_time,
        te.end_time,
        te.duration_minutes,
        te.date,
        c.id AS category_id,
        c.name AS category_name,
        c.color AS category_color
      FROM time_entries te
      INNER JOIN categories c ON te.category_id = c.id
      WHERE te.date = ?
      ORDER BY te.start_time DESC
    `
    ).all(date);
    return entries;
  } catch (error) {
    return {
      error: error.message || "获取记录列表失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("activities:search", async (_event, keyword) => {
  try {
    const db = getDatabase();
    const activities = db.prepare(
      `
      SELECT DISTINCT activity
      FROM time_entries
      WHERE activity LIKE ? || '%'
      GROUP BY activity
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `
    ).all(keyword);
    return activities.map((item) => item.activity);
  } catch (error) {
    return {
      error: error.message || "搜索事项失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "timeEntries:checkConflict",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { date, startTime, endTime, excludeId } = params;
      let query = `
        SELECT id, activity, start_time, end_time
        FROM time_entries
        WHERE date = ?
          AND (
            (start_time < ? AND end_time > ?)
            OR (start_time < ? AND end_time > ?)
            OR (start_time >= ? AND start_time < ?)
            OR (end_time > ? AND end_time <= ?)
          )
      `;
      const queryParams = [
        date,
        endTime,
        startTime,
        endTime,
        startTime,
        startTime,
        endTime,
        startTime,
        endTime
      ];
      if (excludeId) {
        query += " AND id != ?";
        queryParams.push(excludeId);
      }
      const conflicts = db.prepare(query).all(...queryParams);
      return conflicts;
    } catch (error) {
      return {
        error: error.message || "检测时间冲突失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "timeEntries:create",
  async (_event, data) => {
    try {
      const db = getDatabase();
      const { categoryId, activity, startTime, endTime, date, notes } = data;
      const durationMinutes = calculateDuration(startTime, endTime);
      if (durationMinutes <= 0) {
        return {
          error: "结束时间必须大于开始时间",
          code: "INVALID_TIME_RANGE"
        };
      }
      if (durationMinutes > 1440) {
        return {
          error: "单次记录时长不能超过 24 小时",
          code: "DURATION_TOO_LONG"
        };
      }
      const result = db.prepare(
        `
        INSERT INTO time_entries
          (category_id, activity, start_time, end_time, duration_minutes, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(categoryId, activity, startTime, endTime, durationMinutes, date, notes || null);
      return {
        success: true,
        id: Number(result.lastInsertRowid)
      };
    } catch (error) {
      return {
        error: error.message || "创建记录失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "timeEntries:update",
  async (_event, id, data) => {
    try {
      const db = getDatabase();
      const { categoryId, activity, startTime, endTime, notes } = data;
      const existing = db.prepare("SELECT date FROM time_entries WHERE id = ?").get(id);
      if (!existing) {
        return {
          error: "记录不存在",
          code: "NOT_FOUND"
        };
      }
      const durationMinutes = calculateDuration(startTime, endTime);
      if (durationMinutes <= 0) {
        return {
          error: "结束时间必须大于开始时间",
          code: "INVALID_TIME_RANGE"
        };
      }
      if (durationMinutes > 1440) {
        return {
          error: "单次记录时长不能超过 24 小时",
          code: "DURATION_TOO_LONG"
        };
      }
      db.prepare(
        `
        UPDATE time_entries
        SET category_id = ?,
            activity = ?,
            start_time = ?,
            end_time = ?,
            duration_minutes = ?,
            notes = ?
        WHERE id = ?
      `
      ).run(categoryId, activity, startTime, endTime, durationMinutes, notes || null, id);
      return { success: true };
    } catch (error) {
      return {
        error: error.message || "更新记录失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle("timeEntries:delete", async (_event, id) => {
  try {
    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM time_entries WHERE id = ?").get(id);
    if (!existing) {
      return {
        error: "记录不存在",
        code: "NOT_FOUND"
      };
    }
    db.prepare("DELETE FROM time_entries WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "删除记录失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "timeEntries:getByDateRange",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const {
        startDate,
        endDate,
        categoryIds,
        keyword,
        limit = 20,
        offset = 0
      } = params;
      const conditions = ["te.date BETWEEN ? AND ?"];
      const queryParams = [startDate, endDate];
      if (categoryIds && categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => "?").join(",");
        conditions.push(`te.category_id IN (${placeholders})`);
        queryParams.push(...categoryIds);
      }
      if (keyword) {
        conditions.push("te.activity LIKE ?");
        queryParams.push(`%${keyword}%`);
      }
      const whereClause = conditions.join(" AND ");
      const totalResult = db.prepare(
        `
        SELECT COUNT(*) AS total
        FROM time_entries te
        WHERE ${whereClause}
      `
      ).get(...queryParams);
      const entries = db.prepare(
        `
        SELECT
          te.id,
          te.activity,
          te.start_time,
          te.end_time,
          te.duration_minutes,
          te.date,
          c.id AS category_id,
          c.name AS category_name,
          c.color AS category_color
        FROM time_entries te
        INNER JOIN categories c ON te.category_id = c.id
        WHERE ${whereClause}
        ORDER BY te.date DESC, te.start_time DESC
        LIMIT ? OFFSET ?
      `
      ).all(...queryParams, limit, offset);
      return {
        data: entries,
        total: totalResult.total
      };
    } catch (error) {
      return {
        error: error.message || "查询记录失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "analysis:getCategoryStats",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { startDate, endDate } = params;
      const totalResult = db.prepare(
        `
        SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM time_entries
        WHERE date BETWEEN ? AND ?
      `
      ).get(startDate, endDate);
      const totalMinutes = totalResult.total_minutes;
      const stats = db.prepare(
        `
        SELECT
          c.id,
          c.name,
          c.color,
          COALESCE(SUM(te.duration_minutes), 0) / 60.0 AS total_hours,
          COALESCE(
            CASE
              WHEN ? > 0 THEN (SUM(te.duration_minutes) * 100.0 / ?)
              ELSE 0
            END,
            0
          ) AS percentage,
          COUNT(te.id) AS entry_count
        FROM categories c
        LEFT JOIN time_entries te
          ON c.id = te.category_id
          AND te.date BETWEEN ? AND ?
        WHERE c.is_active = 1
        GROUP BY c.id, c.name, c.color
        ORDER BY total_hours DESC
      `
      ).all(
        totalMinutes,
        totalMinutes,
        startDate,
        endDate
      );
      return stats;
    } catch (error) {
      return {
        error: error.message || "获取分类统计失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "analysis:getTrendData",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { startDate, endDate, groupBy } = params;
      const dateGroupClause = groupBy === "day" ? "te.date" : "strftime('%Y-W%W', te.date) || '-' || strftime('%w', te.date)";
      const trendData = db.prepare(
        `
        SELECT
          ${dateGroupClause} AS date_group,
          c.id AS category_id,
          c.name AS category_name,
          c.color,
          SUM(te.duration_minutes) / 60.0 AS total_hours
        FROM time_entries te
        INNER JOIN categories c ON te.category_id = c.id
        WHERE te.date BETWEEN ? AND ?
        GROUP BY date_group, c.id, c.name, c.color
        ORDER BY date_group ASC, c.sort_order ASC
      `
      ).all(startDate, endDate);
      return trendData;
    } catch (error) {
      return {
        error: error.message || "获取趋势数据失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "analysis:getTotalHours",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { startDate, endDate } = params;
      const result = db.prepare(
        `
        SELECT
          COALESCE(SUM(duration_minutes), 0) / 60.0 AS total_hours,
          COUNT(*) AS total_entries
        FROM time_entries
        WHERE date BETWEEN ? AND ?
      `
      ).get(startDate, endDate);
      return {
        total_hours: result.total_hours,
        total_entries: result.total_entries
      };
    } catch (error) {
      return {
        error: error.message || "获取总用时失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "analysis:getActivityRanking",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { startDate, endDate, limit = 10 } = params;
      const ranking = db.prepare(
        `
        SELECT
          activity,
          SUM(duration_minutes) / 60.0 AS total_hours,
          COUNT(*) AS frequency
        FROM time_entries
        WHERE date BETWEEN ? AND ?
        GROUP BY activity
        ORDER BY total_hours DESC
        LIMIT ?
      `
      ).all(startDate, endDate, limit);
      return ranking;
    } catch (error) {
      return {
        error: error.message || "获取事项排行失败",
        code: "DB_ERROR"
      };
    }
  }
);
async function exportToExcel(options = {}) {
  const db = getDatabase();
  const { startDate, endDate, categoryIds } = options;
  let whereClause = "1 = 1";
  const queryParams = [];
  if (startDate) {
    whereClause += " AND te.date >= ?";
    queryParams.push(startDate);
  }
  if (endDate) {
    whereClause += " AND te.date <= ?";
    queryParams.push(endDate);
  }
  if (categoryIds && categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => "?").join(",");
    whereClause += ` AND te.category_id IN (${placeholders})`;
    queryParams.push(...categoryIds);
  }
  const query = `
    SELECT
      te.date AS '日期',
      te.start_time AS '开始时间',
      te.end_time AS '结束时间',
      te.activity AS '事项',
      c.name AS '分类',
      te.duration_minutes AS '时长(分钟)',
      ROUND(te.duration_minutes / 60.0, 2) AS '时长(小时)',
      te.notes AS '备注'
    FROM time_entries te
    INNER JOIN categories c ON te.category_id = c.id
    WHERE ${whereClause}
    ORDER BY te.date DESC, te.start_time DESC
  `;
  const rows = db.prepare(query).all(...queryParams);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("时间记录");
  worksheet.columns = [
    { header: "日期", key: "日期", width: 12 },
    { header: "开始时间", key: "开始时间", width: 10 },
    { header: "结束时间", key: "结束时间", width: 10 },
    { header: "事项", key: "事项", width: 30 },
    { header: "分类", key: "分类", width: 12 },
    { header: "时长(分钟)", key: "时长(分钟)", width: 12 },
    { header: "时长(小时)", key: "时长(小时)", width: 12 },
    { header: "备注", key: "备注", width: 30 }
  ];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" }
  };
  rows.forEach((row) => {
    worksheet.addRow(row);
  });
  const dateStr = startDate || endDate ? `${startDate || ""}_${endDate || ""}` : "all";
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: `TimeTracker_导出_${dateStr}.xlsx`,
    filters: [{ name: "Excel 文件", extensions: ["xlsx"] }]
  });
  if (canceled || !filePath) {
    return { cancelled: true };
  }
  await workbook.xlsx.writeFile(filePath);
  return {
    success: true,
    filePath,
    recordCount: rows.length
  };
}
ipcMain.handle(
  "export:excel",
  async (_event, options) => {
    try {
      return await exportToExcel(options);
    } catch (error) {
      return {
        error: error.message || "导出 Excel 失败",
        code: "EXPORT_ERROR"
      };
    }
  }
);
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  getDatabase();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
