import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

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
  AUTH_TOKEN_RECEIVED = "AUTH_TOKEN_RECEIVED",
  OPEN_REPL_WINDOW = "OPEN_REPL_WINDOW",
  OPEN_SPLASH_SCREEN_WINDOW = "OPEN_SPLASH_SCREEN_WINDOW",
  OPEN_EXTERNAL_URL = "OPEN_EXTERNAL_URL",
  LOGOUT = "LOGOUT",
  CONFIRM_CLOSE_CURRENT_WINDOW = "CONFIRM_CLOSE_CURRENT_WINDOW",
}

// Passed in as an entry to the `additionalArguments` array in `webPreferences`
const versionArg = process.argv.find((arg) => arg.includes("app-version"));

if (!versionArg) {
  throw new Error("Expected app-version argument");
}

const [, version] = versionArg.split("=");

contextBridge.exposeInMainWorld("replitDesktop", {
  closeCurrentWindow: () => ipcRenderer.send(events.CLOSE_CURRENT_WINDOW),
  openReplWindow: (replSlug: string) =>
    ipcRenderer.send(events.OPEN_REPL_WINDOW, replSlug),
  openSplashScreenWindow: () =>
    ipcRenderer.send(events.OPEN_SPLASH_SCREEN_WINDOW),
  openExternalUrl: (url: string) =>
    ipcRenderer.send(events.OPEN_EXTERNAL_URL, url),
  onAuthTokenReceived: (callback: (token: string) => void) => {
    function listener(_event: IpcRendererEvent, token: string) {
      callback(token);
    }

    ipcRenderer.once(events.AUTH_TOKEN_RECEIVED, listener);

    return () => {
      ipcRenderer.removeListener(events.AUTH_TOKEN_RECEIVED, listener);
    };
  },
  logout: () => ipcRenderer.send(events.LOGOUT),
  confirmCloseCurrentWindow: (message: string) =>
    ipcRenderer.send(events.CONFIRM_CLOSE_CURRENT_WINDOW, message),
  version,
});
