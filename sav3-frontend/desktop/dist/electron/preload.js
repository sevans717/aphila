"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    getVersion: () => electron_1.ipcRenderer.invoke("app-version"),
    getPlatform: () => electron_1.ipcRenderer.invoke("platform"),
    openExternal: (url) => electron_1.ipcRenderer.invoke("open-external", url),
    // Add more secure API methods as needed
    minimize: () => electron_1.ipcRenderer.send("window-minimize"),
    maximize: () => electron_1.ipcRenderer.send("window-maximize"),
    close: () => electron_1.ipcRenderer.send("window-close"),
    // File operations (if needed)
    selectFile: (options) => electron_1.ipcRenderer.invoke("dialog-select-file", options),
    // Notification API
    showNotification: (options) => electron_1.ipcRenderer.send("show-notification", options),
});
