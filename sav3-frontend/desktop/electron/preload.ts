import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("app-version"),
  getPlatform: () => ipcRenderer.invoke("platform"),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  // Add more secure API methods as needed
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),

  // File operations (if needed)
  selectFile: (options?: any) =>
    ipcRenderer.invoke("dialog-select-file", options),

  // Notification API
  showNotification: (options: { title: string; body: string }) =>
    ipcRenderer.send("show-notification", options),
});

// Type declaration for window object
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      selectFile: (options?: any) => Promise<any>;
      showNotification: (options: { title: string; body: string }) => void;
    };
  }
}
