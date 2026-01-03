import { ipcMain } from 'electron'
import { exportToExcel } from '../../services/excel'

// 导出 Excel
ipcMain.handle(
  'export:excel',
  async (
    _event,
    options: {
      startDate?: string
      endDate?: string
      categoryIds?: number[]
    }
  ) => {
    try {
      return await exportToExcel(options)
    } catch (error: any) {
      return {
        error: error.message || '导出 Excel 失败',
        code: 'EXPORT_ERROR',
      }
    }
  }
)

