import ExcelJS from 'exceljs'
import { dialog } from 'electron'
import { getDatabase } from '../database'

export interface ExportOptions {
  startDate?: string
  endDate?: string
  categoryIds?: number[]
}

export interface ExportResult {
  success: true
  filePath: string
  recordCount: number
}

export interface ExportCancelled {
  cancelled: true
}

/**
 * 导出时间段记录为 Excel 文件
 */
export async function exportToExcel(
  options: ExportOptions = {}
): Promise<ExportResult | ExportCancelled> {
  const db = getDatabase()
  const { startDate, endDate, categoryIds } = options

  // 构建查询条件
  let whereClause = '1 = 1'
  const queryParams: any[] = []

  if (startDate) {
    whereClause += ' AND te.date >= ?'
    queryParams.push(startDate)
  }

  if (endDate) {
    whereClause += ' AND te.date <= ?'
    queryParams.push(endDate)
  }

  if (categoryIds && categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => '?').join(',')
    whereClause += ` AND te.category_id IN (${placeholders})`
    queryParams.push(...categoryIds)
  }

  // 查询数据
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
  `

  const rows = db.prepare(query).all(...queryParams) as Array<{
    日期: string
    开始时间: string
    结束时间: string
    事项: string
    分类: string
    '时长(分钟)': number
    '时长(小时)': number
    备注: string | null
  }>

  // 创建 Excel 工作簿
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('时间记录')

  // 设置列宽
  worksheet.columns = [
    { header: '日期', key: '日期', width: 12 },
    { header: '开始时间', key: '开始时间', width: 10 },
    { header: '结束时间', key: '结束时间', width: 10 },
    { header: '事项', key: '事项', width: 30 },
    { header: '分类', key: '分类', width: 12 },
    { header: '时长(分钟)', key: '时长(分钟)', width: 12 },
    { header: '时长(小时)', key: '时长(小时)', width: 12 },
    { header: '备注', key: '备注', width: 30 },
  ]

  // 设置表头样式
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // 添加数据行
  rows.forEach((row) => {
    worksheet.addRow(row)
  })

  // 弹出保存对话框
  const dateStr = startDate || endDate ? `${startDate || ''}_${endDate || ''}` : 'all'
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: `TimeTracker_导出_${dateStr}.xlsx`,
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }],
  })

  if (canceled || !filePath) {
    return { cancelled: true }
  }

  // 保存文件
  await workbook.xlsx.writeFile(filePath)

  return {
    success: true,
    filePath,
    recordCount: rows.length,
  }
}

