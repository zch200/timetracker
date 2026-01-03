// IPC handlers 导入（会自动注册）
import './handlers'
import './handlers/dimensions'
import './handlers/timeEntries'
import './handlers/analysis'
import './handlers/export'

// 这个文件主要用于统一导入所有 handlers
// 具体的 handlers 注册逻辑在各个 handler 文件中

