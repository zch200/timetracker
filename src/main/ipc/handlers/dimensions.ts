import { ipcMain } from 'electron'
import { getDatabase } from '../../database'
import { Dimension, DimensionOption } from '../../database/types'

// 获取所有维度（包含选项）
ipcMain.handle('dimensions:getAll', async () => {
  try {
    const db = getDatabase()
    const dimensions = db.prepare('SELECT * FROM dimensions ORDER BY "order" ASC').all() as Dimension[]

    const result = dimensions.map((dim) => {
      const options = db
        .prepare('SELECT * FROM dimension_options WHERE dimension_id = ? ORDER BY "order" ASC')
        .all(dim.id) as DimensionOption[]
      return {
        ...dim,
        options,
      }
    })

    return result
  } catch (error: any) {
    return {
      error: error.message || '获取维度失败',
      code: 'DB_ERROR',
    }
  }
})

// 创建维度
ipcMain.handle('dimensions:create', async (_event, params: { name: string; order?: number }) => {
  try {
    const db = getDatabase()
    const { name, order = 0 } = params
    const result = db
      .prepare('INSERT INTO dimensions (name, "order") VALUES (?, ?)')
      .run(name, order)
    return { success: true, id: Number(result.lastInsertRowid) }
  } catch (error: any) {
    return {
      error: error.message || '创建维度失败',
      code: 'DB_ERROR',
    }
  }
})

// 更新维度
ipcMain.handle(
  'dimensions:update',
  async (_event, id: number, params: { name?: string; order?: number }) => {
    try {
      const db = getDatabase()
      const { name, order } = params
      const updates: string[] = []
      const values: any[] = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (order !== undefined) {
        updates.push('"order" = ?')
        values.push(order)
      }

      if (updates.length === 0) return { success: true }

      updates.push("updated_at = datetime('now', 'localtime')")
      values.push(id)

      db.prepare(`UPDATE dimensions SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      return { success: true }
    } catch (error: any) {
      return {
        error: error.message || '更新维度失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 删除维度
ipcMain.handle('dimensions:delete', async (_event, id: number) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM dimensions WHERE id = ?').run(id)
    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '删除维度失败',
      code: 'DB_ERROR',
    }
  }
})

// 启用/禁用维度
ipcMain.handle('dimensions:toggle', async (_event, id: number, is_active: boolean) => {
  try {
    const db = getDatabase()
    db.prepare(
      "UPDATE dimensions SET is_active = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(is_active ? 1 : 0, id)
    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '切换维度状态失败',
      code: 'DB_ERROR',
    }
  }
})

// 创建选项
ipcMain.handle(
  'options:create',
  async (_event, params: { dimension_id: number; name: string; color: string; order?: number }) => {
    try {
      const db = getDatabase()
      const { dimension_id, name, color, order = 0 } = params
      const result = db
        .prepare('INSERT INTO dimension_options (dimension_id, name, color, "order") VALUES (?, ?, ?, ?)')
        .run(dimension_id, name, color, order)
      return { success: true, id: Number(result.lastInsertRowid) }
    } catch (error: any) {
      return {
        error: error.message || '创建选项失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 更新选项
ipcMain.handle(
  'options:update',
  async (_event, id: number, params: { name?: string; color?: string; order?: number }) => {
    try {
      const db = getDatabase()
      const { name, color, order } = params
      const updates: string[] = []
      const values: any[] = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (color !== undefined) {
        updates.push('color = ?')
        values.push(color)
      }
      if (order !== undefined) {
        updates.push('"order" = ?')
        values.push(order)
      }

      if (updates.length === 0) return { success: true }

      updates.push("updated_at = datetime('now', 'localtime')")
      values.push(id)

      db.prepare(`UPDATE dimension_options SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      return { success: true }
    } catch (error: any) {
      return {
        error: error.message || '更新选项失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 删除选项
ipcMain.handle('options:delete', async (_event, id: number) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM dimension_options WHERE id = ?').run(id)
    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '删除选项失败',
      code: 'DB_ERROR',
    }
  }
})

