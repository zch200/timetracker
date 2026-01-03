import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { join } from "path";
import { createRequire } from "module";
import ExcelJS from "exceljs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const schema = `-- 1. 维度表
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
`;
const require$1 = createRequire(import.meta.url);
const Database = require$1("better-sqlite3");
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
ipcMain.handle("dimensions:getAll", async () => {
  try {
    const db = getDatabase();
    const dimensions = db.prepare('SELECT * FROM dimensions ORDER BY "order" ASC').all();
    const result = dimensions.map((dim) => {
      const options = db.prepare('SELECT * FROM dimension_options WHERE dimension_id = ? ORDER BY "order" ASC').all(dim.id);
      return {
        ...dim,
        options
      };
    });
    return result;
  } catch (error) {
    return {
      error: error.message || "获取维度失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("dimensions:create", async (_event, params) => {
  try {
    const db = getDatabase();
    const { name, order = 0 } = params;
    const result = db.prepare('INSERT INTO dimensions (name, "order") VALUES (?, ?)').run(name, order);
    return { success: true, id: Number(result.lastInsertRowid) };
  } catch (error) {
    return {
      error: error.message || "创建维度失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "dimensions:update",
  async (_event, id, params) => {
    try {
      const db = getDatabase();
      const { name, order } = params;
      const updates = [];
      const values = [];
      if (name !== void 0) {
        updates.push("name = ?");
        values.push(name);
      }
      if (order !== void 0) {
        updates.push('"order" = ?');
        values.push(order);
      }
      if (updates.length === 0) return { success: true };
      updates.push("updated_at = datetime('now', 'localtime')");
      values.push(id);
      db.prepare(`UPDATE dimensions SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      return { success: true };
    } catch (error) {
      return {
        error: error.message || "更新维度失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle("dimensions:delete", async (_event, id) => {
  try {
    const db = getDatabase();
    db.prepare("DELETE FROM dimensions WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "删除维度失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("dimensions:toggle", async (_event, id, is_active) => {
  try {
    const db = getDatabase();
    db.prepare(
      "UPDATE dimensions SET is_active = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(is_active ? 1 : 0, id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "切换维度状态失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "options:create",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { dimension_id, name, color, order = 0 } = params;
      const result = db.prepare('INSERT INTO dimension_options (dimension_id, name, color, "order") VALUES (?, ?, ?, ?)').run(dimension_id, name, color, order);
      return { success: true, id: Number(result.lastInsertRowid) };
    } catch (error) {
      return {
        error: error.message || "创建选项失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "options:update",
  async (_event, id, params) => {
    try {
      const db = getDatabase();
      const { name, color, order } = params;
      const updates = [];
      const values = [];
      if (name !== void 0) {
        updates.push("name = ?");
        values.push(name);
      }
      if (color !== void 0) {
        updates.push("color = ?");
        values.push(color);
      }
      if (order !== void 0) {
        updates.push('"order" = ?');
        values.push(order);
      }
      if (updates.length === 0) return { success: true };
      updates.push("updated_at = datetime('now', 'localtime')");
      values.push(id);
      db.prepare(`UPDATE dimension_options SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      return { success: true };
    } catch (error) {
      return {
        error: error.message || "更新选项失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle("options:delete", async (_event, id) => {
  try {
    const db = getDatabase();
    db.prepare("DELETE FROM dimension_options WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "删除选项失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("timeEntries:getByDate", async (_event, date) => {
  try {
    const db = getDatabase();
    const entries = db.prepare(
      `
      SELECT
        te.id,
        te.title,
        te.start_time,
        te.end_time,
        te.duration_seconds,
        te.description,
        te.created_at,
        te.updated_at
      FROM time_entries te
      WHERE DATE(te.start_time) = ?
      ORDER BY te.start_time DESC
    `
    ).all(date);
    const result = entries.map((entry) => {
      const dimensions = db.prepare(
        `
        SELECT
          d.id AS dimension_id,
          d.name AS dimension_name,
          do.id AS option_id,
          do.name AS option_name,
          do.color AS option_color
        FROM entry_attributes ea
        JOIN dimension_options do ON ea.option_id = do.id
        JOIN dimensions d ON do.dimension_id = d.id
        WHERE ea.entry_id = ?
      `
      ).all(entry.id);
      return {
        ...entry,
        dimensions
      };
    });
    return result;
  } catch (error) {
    return {
      error: error.message || "获取记录列表失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("timeEntries:getCurrentActive", async () => {
  try {
    const db = getDatabase();
    const entry = db.prepare(
      `
      SELECT
        te.id,
        te.title,
        te.start_time,
        te.end_time,
        te.duration_seconds,
        te.description,
        te.created_at,
        te.updated_at
      FROM time_entries te
      WHERE te.end_time IS NULL
      LIMIT 1
    `
    ).get();
    if (!entry) return null;
    const dimensions = db.prepare(
      `
      SELECT
        d.id AS dimension_id,
        d.name AS dimension_name,
        do.id AS option_id,
        do.name AS option_name,
        do.color AS option_color
      FROM entry_attributes ea
      JOIN dimension_options do ON ea.option_id = do.id
      JOIN dimensions d ON do.dimension_id = d.id
      WHERE ea.entry_id = ?
    `
    ).all(entry.id);
    return {
      ...entry,
      dimensions
    };
  } catch (error) {
    return {
      error: error.message || "获取当前活动失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "timeEntries:switch",
  async (_event, params) => {
    const db = getDatabase();
    const { title, optionIds, description } = params;
    const transaction = db.transaction(() => {
      db.prepare(
        `
        UPDATE time_entries
        SET
          end_time = datetime('now', 'localtime'),
          duration_seconds = CAST((julianday(datetime('now', 'localtime')) - julianday(start_time)) * 86400 AS INTEGER),
          updated_at = datetime('now', 'localtime')
        WHERE end_time IS NULL
      `
      ).run();
      const result = db.prepare(
        `
        INSERT INTO time_entries (title, start_time, end_time, duration_seconds, description)
        VALUES (?, datetime('now', 'localtime'), NULL, 0, ?)
      `
      ).run(title, description || null);
      const entryId = Number(result.lastInsertRowid);
      const insertAttr = db.prepare(
        "INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)"
      );
      for (const optionId of optionIds) {
        insertAttr.run(entryId, optionId);
      }
      return entryId;
    });
    try {
      const entryId = transaction();
      return { success: true, id: entryId };
    } catch (error) {
      return {
        error: error.message || "切换活动失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "timeEntries:create",
  async (_event, params) => {
    const db = getDatabase();
    const { title, startTime, endTime, optionIds, description } = params;
    const transaction = db.transaction(() => {
      const result = db.prepare(
        `
        INSERT INTO time_entries (title, start_time, end_time, duration_seconds, description)
        VALUES (?, ?, ?, CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER), ?)
      `
      ).run(title, startTime, endTime, endTime, startTime, description || null);
      const entryId = Number(result.lastInsertRowid);
      const insertAttr = db.prepare(
        "INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)"
      );
      for (const optionId of optionIds) {
        insertAttr.run(entryId, optionId);
      }
      return entryId;
    });
    try {
      const entryId = transaction();
      return { success: true, id: entryId };
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
  async (_event, id, params) => {
    const db = getDatabase();
    const { title, startTime, endTime, optionIds, description } = params;
    const transaction = db.transaction(() => {
      const updates = [];
      const values = [];
      if (title !== void 0) {
        updates.push("title = ?");
        values.push(title);
      }
      if (startTime !== void 0) {
        updates.push("start_time = ?");
        values.push(startTime);
      }
      if (endTime !== void 0) {
        updates.push("end_time = ?");
        values.push(endTime);
        if (endTime && (startTime || true)) {
          const currentStartTime = startTime || db.prepare("SELECT start_time FROM time_entries WHERE id = ?").get(id).start_time;
          updates.push("duration_seconds = CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)");
          values.push(endTime, currentStartTime);
        } else if (endTime === null) {
          updates.push("duration_seconds = 0");
        }
      }
      if (description !== void 0) {
        updates.push("description = ?");
        values.push(description);
      }
      if (updates.length > 0) {
        updates.push("updated_at = datetime('now', 'localtime')");
        values.push(id);
        db.prepare(`UPDATE time_entries SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      if (optionIds !== void 0) {
        db.prepare("DELETE FROM entry_attributes WHERE entry_id = ?").run(id);
        const insertAttr = db.prepare(
          "INSERT INTO entry_attributes (entry_id, option_id) VALUES (?, ?)"
        );
        for (const optionId of optionIds) {
          insertAttr.run(id, optionId);
        }
      }
      return true;
    });
    try {
      transaction();
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
    db.prepare("DELETE FROM time_entries WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    return {
      error: error.message || "删除记录失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("timeEntries:detectGaps", async (_event, date) => {
  try {
    const db = getDatabase();
    const gaps = db.prepare(
      `
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
        end_time AS start_time,
        next_start AS end_time,
        CAST((julianday(next_start) - julianday(end_time)) * 86400 AS INTEGER) AS duration_seconds
      FROM ordered_entries
      WHERE next_start IS NOT NULL
        AND end_time IS NOT NULL
        AND end_time < next_start
    `
    ).all(date);
    return gaps;
  } catch (error) {
    return {
      error: error.message || "检测 Gap 失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("activities:getSmartDefaults", async (_event, title) => {
  try {
    const db = getDatabase();
    const lastEntry = db.prepare(
      `
      SELECT id
      FROM time_entries
      WHERE title = ?
      ORDER BY start_time DESC
      LIMIT 1
    `
    ).get(title);
    if (!lastEntry) return [];
    const optionIds = db.prepare("SELECT option_id FROM entry_attributes WHERE entry_id = ?").all(lastEntry.id);
    return optionIds.map((item) => item.option_id);
  } catch (error) {
    return {
      error: error.message || "获取智能默认失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle("activities:search", async (_event, keyword) => {
  try {
    const db = getDatabase();
    const activities = db.prepare(
      `
      SELECT DISTINCT title
      FROM time_entries
      WHERE title LIKE ? || '%'
      GROUP BY title
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `
    ).all(keyword);
    return activities.map((item) => item.title);
  } catch (error) {
    return {
      error: error.message || "搜索事项失败",
      code: "DB_ERROR"
    };
  }
});
ipcMain.handle(
  "analysis:statsByDimension",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { dimensionId, startDate, endDate } = params;
      const totalResult = db.prepare(
        `
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
      `
      ).get(startDate, endDate);
      const totalSeconds = totalResult.total_seconds;
      const stats = db.prepare(
        `
        SELECT
          do.id AS option_id,
          do.name AS option_name,
          do.color AS color,
          COALESCE(SUM(te.duration_seconds), 0) / 3600.0 AS hours,
          COALESCE(SUM(te.duration_seconds), 0) AS seconds,
          COALESCE(
            CASE
              WHEN ? > 0 THEN (SUM(te.duration_seconds) * 100.0 / ?)
              ELSE 0
            END,
            0
          ) AS percentage,
          COUNT(DISTINCT te.id) AS entry_count
        FROM dimension_options do
        LEFT JOIN entry_attributes ea ON do.id = ea.option_id
        LEFT JOIN time_entries te ON ea.entry_id = te.id AND DATE(te.start_time) BETWEEN ? AND ?
        WHERE do.dimension_id = ?
        GROUP BY do.id, do.name, do.color
        HAVING hours > 0
        ORDER BY hours DESC;
      `
      ).all(totalSeconds, totalSeconds, startDate, endDate, dimensionId);
      return stats;
    } catch (error) {
      return {
        error: error.message || "获取维度统计失败",
        code: "DB_ERROR"
      };
    }
  }
);
ipcMain.handle(
  "analysis:trendByDimension",
  async (_event, params) => {
    try {
      const db = getDatabase();
      const { dimensionId, startDate, endDate, groupBy } = params;
      const dateGroupClause = groupBy === "day" ? "DATE(te.start_time)" : "strftime('%Y-W%W', te.start_time) || '-' || strftime('%w', te.start_time)";
      const trendData = db.prepare(
        `
        SELECT
          ${dateGroupClause} AS date_group,
          do.id AS option_id,
          do.name AS option_name,
          do.color,
          SUM(te.duration_seconds) / 3600.0 AS hours
        FROM time_entries te
        JOIN entry_attributes ea ON te.id = ea.entry_id
        JOIN dimension_options do ON ea.option_id = do.id
        WHERE do.dimension_id = ?
          AND DATE(te.start_time) BETWEEN ? AND ?
        GROUP BY date_group, do.id, do.name, do.color
        ORDER BY date_group ASC, hours DESC
      `
      ).all(dimensionId, startDate, endDate);
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
          COALESCE(SUM(duration_seconds), 0) / 3600.0 AS total_hours,
          COUNT(*) AS total_entries
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
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
          title AS activity,
          SUM(duration_seconds) / 3600.0 AS total_hours,
          COUNT(*) AS frequency
        FROM time_entries
        WHERE DATE(start_time) BETWEEN ? AND ?
        GROUP BY title
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
