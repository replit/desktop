import { contextBridge, ipcRenderer } from "electron";

// Set `window.isDesktopApp`
contextBridge.exposeInMainWorld("isDesktopApp", true);

contextBridge.exposeInMainWorld("desktopAppApi", {
  closeWindow: () => ipcRenderer.send("WINDOW_CLOSE"),
});
