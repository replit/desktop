import { contextBridge } from "electron";

// Set `window.isDesktopApp`
contextBridge.exposeInMainWorld('isDesktopApp', true);
