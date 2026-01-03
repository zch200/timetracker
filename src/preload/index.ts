import { contextBridge, ipcRenderer } from 'electron'

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
})

