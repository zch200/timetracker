"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => {
    return electron.ipcRenderer.invoke(channel, ...args);
  }
});
