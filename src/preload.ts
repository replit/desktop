import { contextBridge, ipcRenderer } from "electron";

// Set `window.isDesktopApp`
contextBridge.exposeInMainWorld("isDesktopApp", true);

// Note that it might be tempting to move the keys used in `ipcRenderer.send()`,
// and import that file in `main.ts` as well, but then we'd have to turn on `nodeIntegration`,
// as the `preload` script would need to `require` som other file!
// We hardcode things in here instead, at least until we find a better solution.
contextBridge.exposeInMainWorld("desktopAppApi", {
  closeThisWindow: () => ipcRenderer.send("CLOSE_THIS_WINDOW"),
  openReplWindow: (replSlug: string) =>
    ipcRenderer.send("OPEN_REPL_WINDOW", replSlug),
});
