import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Database as SQLiteDatabase } from 'better-sqlite3'
// @ts-ignore (raw import is handled by vite)
import schema from './schema.sql?raw'

class TimeTrackerDatabase {
  private db: SQLiteDatabase | null = null
  private static instance: TimeTrackerDatabase | null = null

  private constructor() {
    this.initialize()
  }

  public static getInstance(): TimeTrackerDatabase {
    if (!TimeTrackerDatabase.instance) {
      TimeTrackerDatabase.instance = new TimeTrackerDatabase()
    }
    return TimeTrackerDatabase.instance
  }

  private initialize(): void {
    // 获取数据库文件路径
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'timetracker.db')

    // 创建数据库连接
    this.db = new Database(dbPath)

    // 配置数据库
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('journal_mode = WAL')

    // 创建表结构
    this.createTables()
  }

  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // 执行 SQL 语句
    this.db.exec(schema)
  }

  public getDatabase(): SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  public close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      TimeTrackerDatabase.instance = null
    }
  }
}

// 导出单例函数
export function getDatabase(): SQLiteDatabase {
  return TimeTrackerDatabase.getInstance().getDatabase()
}

// 导出类（用于测试等场景）
export { TimeTrackerDatabase }

