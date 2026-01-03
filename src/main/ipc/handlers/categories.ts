import { ipcMain } from 'electron'
import { getDatabase } from '../../database'

// 获取所有分类（含记录数）
ipcMain.handle('categories:getAll', async () => {
  try {
    const db = getDatabase()

    // 查询所有启用的分类及其关联记录数
    const categories = db
      .prepare(
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
      )
      .all() as Array<{
      id: number
      name: string
      color: string
      sort_order: number
      is_active: number
      entry_count: number
    }>

    return categories
  } catch (error: any) {
    return {
      error: error.message || '获取分类列表失败',
      code: 'DB_ERROR',
    }
  }
})

// 创建分类
ipcMain.handle(
  'categories:create',
  async (
    _event,
    params: {
      name: string
      color: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { name, color } = params

      // 检查名称是否已存在
      const existing = db
        .prepare('SELECT id FROM categories WHERE name = ? AND is_active = 1')
        .get(name)

      if (existing) {
        return {
          error: '分类名称已存在',
          code: 'DUPLICATE_NAME',
        }
      }

      // 获取最大 sort_order，新分类排在最后
      const maxOrder = db
        .prepare('SELECT MAX(sort_order) AS max_order FROM categories')
        .get() as { max_order: number | null }

      const sortOrder = (maxOrder.max_order ?? 0) + 1

      // 插入新分类
      const result = db
        .prepare(
          'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)'
        )
        .run(name, color, sortOrder)

      return {
        success: true,
        id: Number(result.lastInsertRowid),
      }
    } catch (error: any) {
      return {
        error: error.message || '创建分类失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 更新分类
ipcMain.handle(
  'categories:update',
  async (
    _event,
    id: number,
    params: {
      name?: string
      color?: string
    }
  ) => {
    try {
      const db = getDatabase()
      const { name, color } = params

      // 如果更新名称，检查是否与其他分类重复
      if (name) {
        const existing = db
          .prepare(
            'SELECT id FROM categories WHERE name = ? AND id != ? AND is_active = 1'
          )
          .get(name, id)

        if (existing) {
          return {
            error: '分类名称已存在',
            code: 'DUPLICATE_NAME',
          }
        }
      }

      // 构建更新语句
      const updates: string[] = []
      const values: any[] = []

      if (name) {
        updates.push('name = ?')
        values.push(name)
      }
      if (color) {
        updates.push('color = ?')
        values.push(color)
      }

      if (updates.length === 0) {
        return { success: true }
      }

      values.push(id)

      const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`
      db.prepare(sql).run(...values)

      return { success: true }
    } catch (error: any) {
      return {
        error: error.message || '更新分类失败',
        code: 'DB_ERROR',
      }
    }
  }
)

// 删除分类（软删除）
ipcMain.handle('categories:delete', async (_event, id: number) => {
  try {
    const db = getDatabase()

    // 检查是否为最后一个启用的分类
    const activeCount = db
      .prepare('SELECT COUNT(*) AS count FROM categories WHERE is_active = 1')
      .get() as { count: number }

    if (activeCount.count <= 1) {
      return {
        error: '至少需要保留一个分类',
        code: 'LAST_CATEGORY',
      }
    }

    // 检查是否有关联记录
    const entryCount = db
      .prepare('SELECT COUNT(*) AS count FROM time_entries WHERE category_id = ?')
      .get(id) as { count: number }

    if (entryCount.count > 0) {
      return {
        error: `该分类下有 ${entryCount.count} 条记录，无法删除`,
        code: 'HAS_ENTRIES',
      }
    }

    // 软删除：设置 is_active = 0
    db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id)

    return { success: true }
  } catch (error: any) {
    return {
      error: error.message || '删除分类失败',
      code: 'DB_ERROR',
    }
  }
})

