import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { events } from "./events";

// Passed in as an entry to the `additionalArguments` array in `webPreferences`
const versionArg = process.argv.find((arg) => arg.includes("app-version"));

if (!versionArg) {
  throw new Error("Expected app-version argument");
}

const [, version] = versionArg.split("=");

function makeEventHandler(event: events) {
  return function (callback: () => void) {
    ipcRenderer.on(event, callback);

    return () => {
      ipcRenderer.removeListener(event, callback);
    };
  };
}

contextBridge.exposeInMainWorld("replitDesktop", {
  closeCurrentWindow: () => ipcRenderer.send(events.CLOSE_CURRENT_WINDOW),
  openReplWindow: (replSlug: string) =>
    ipcRenderer.send(events.OPEN_REPL_WINDOW, replSlug),
  openExternalUrl: (url: string) =>
    ipcRenderer.send(events.OPEN_EXTERNAL_URL, url),
  onAuthTokenReceived: (callback: (token: string) => void) => {
    function listener(_event: IpcRendererEvent, token: string) {
      callback(token);
    }

    ipcRenderer.on(events.AUTH_TOKEN_RECEIVED, listener);

    return () => {
      ipcRenderer.removeListener(events.AUTH_TOKEN_RECEIVED, listener);
    };
  },
  onEnterFullscreen: makeEventHandler(events.ON_ENTER_FULLSCREEN),
  onLeaveFullscreen: makeEventHandler(events.ON_LEAVE_FULLSCREEN),
  logout: () => ipcRenderer.send(events.LOGOUT),
  version,
});
