import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { events } from "./events";

function makeEventHandler(event: events) {
  return function (callback: () => void) {
    ipcRenderer.on(event, callback);

    return () => {
      ipcRenderer.removeListener(event, callback);
    };
  };
}

function parseArgument(name: string) {
  // Must be passed in as an entry to the `additionalArguments` array in `webPreferences`
  const arg = process.argv.find((a) => a.includes(`--${name}=`));

  if (!arg) {
    throw new Error(`Expected ${name} argument`);
  }

  const [, value] = arg.split("=");

  return value;
}

const version = parseArgument('app-version');
const platform = parseArgument('platform');

contextBridge.exposeInMainWorld("replitDesktop", {
  closeCurrentWindow: () => ipcRenderer.send(events.CLOSE_CURRENT_WINDOW),
  openWindow: (replSlug: string) =>
    ipcRenderer.send(events.OPEN_WINDOW, replSlug),
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
  showMessageBox: async (params: Electron.MessageBoxOptions) =>
    ipcRenderer.invoke(events.SHOW_MESSAGE_BOX, params),
  onEnterFullscreen: makeEventHandler(events.ON_ENTER_FULLSCREEN),
  onLeaveFullscreen: makeEventHandler(events.ON_LEAVE_FULLSCREEN),
  logout: () => ipcRenderer.send(events.LOGOUT),
  platform,
  version,
});
