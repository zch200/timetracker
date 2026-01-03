import { ipcMain } from 'electron'

// 测试 IPC handler
ipcMain.handle('test:ping', async () => {
  return { success: true, message: 'pong' }
})

