"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const isDev = process.env.NODE_ENV === "development" || !electron_1.app.isPackaged;
let mainWindow = null;
const createWindow = () => {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, "preload.js"),
        },
        titleBarStyle: "default",
        icon: isDev ? undefined : (0, path_1.join)(__dirname, "../assets/icon.png"),
        show: false, // Don't show until ready
    });
    // Load the app
    const startUrl = isDev
        ? "http://localhost:3000"
        : `file://${(0, path_1.join)(__dirname, "../react/index.html")}`;
    mainWindow.loadURL(startUrl);
    // Show when ready to prevent visual flash
    mainWindow.once("ready-to-show", () => {
        if (mainWindow) {
            mainWindow.show();
            // Focus on window
            if (isDev) {
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Handle window closed
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
};
// App event listeners
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Security: Prevent new window creation
electron_1.app.on("web-contents-created", (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
});
// Custom menu
const template = [
    {
        label: "SAV3",
        submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
        ],
    },
    {
        label: "File",
        submenu: [{ role: "close" }],
    },
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "selectAll" },
        ],
    },
    {
        label: "View",
        submenu: [
            { role: "reload" },
            { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
        ],
    },
    {
        label: "Window",
        submenu: [
            { role: "minimize" },
            { role: "zoom" },
            { type: "separator" },
            { role: "front" },
        ],
    },
];
const menu = electron_1.Menu.buildFromTemplate(template);
electron_1.Menu.setApplicationMenu(menu);
// IPC handlers for main process communication
electron_1.ipcMain.handle("app-version", () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle("platform", () => {
    return process.platform;
});
