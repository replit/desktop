import { contextBridge, ipcRenderer } from "electron";

/**
 * Events that correspond to the protocol we use when communicating
 * with the main process via IPC.
 *
 * Note this must match the events enum declared in `constants.ts`.
 * Code cannot be shared between the two since they exist in
 * different contexts when `nodeIntegration` is turned off so
 * we must maintain a separate copy here.
 */
enum events {
  CLOSE_CURRENT_WINDOW = "CLOSE_CURRENT_WINDOW",
  OPEN_REPL_WINDOW = "OPEN_REPL_WINDOW",
  LOGOUT = "LOGOUT",
}

// Set `window.isDesktopApp`
contextBridge.exposeInMainWorld("isDesktopApp", true);

contextBridge.exposeInMainWorld("desktopAppApi", {
  closeCurrentWindow: () => ipcRenderer.send(events.CLOSE_CURRENT_WINDOW),
  openReplWindow: (replSlug: string) =>
    ipcRenderer.send(events.OPEN_REPL_WINDOW, replSlug),
  logout: () => ipcRenderer.send(events.LOGOUT),
});
