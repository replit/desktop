import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { events } from './events';

function parseArgument(name: string) {
  // Must be passed in as an entry to the `additionalArguments` array in `webPreferences`
  const arg = process.argv.find((a) => a.includes(`--${name}=`));

  if (!arg) {
    throw new Error(`Expected ${name} argument`);
  }

  const [, value] = arg.split('=');

  return value;
}

const version = parseArgument('app-version');
const platform = parseArgument('platform');

contextBridge.exposeInMainWorld('replitDesktop', {
  closeCurrentWindow: () => ipcRenderer.send(events.CLOSE_CURRENT_WINDOW),
  openWindow: (path: string) => ipcRenderer.send(events.OPEN_WINDOW, path),
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
  onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => {
    function listener(_event: IpcRendererEvent, isFullScreen: boolean) {
      callback(isFullScreen);
    }

    ipcRenderer.on(events.ON_FULLSCREEN_CHANGED, listener);

    return () => {
      ipcRenderer.removeListener(events.ON_FULLSCREEN_CHANGED, listener);
    };
  },
  onFocusChanged: (callback: (isFocused: boolean) => void) => {
    function listener(_event: IpcRendererEvent, isFocused: boolean) {
      callback(isFocused);
    }

    ipcRenderer.on(events.ON_FOCUSED_CHANGED, listener);

    return () => {
      ipcRenderer.removeListener(events.ON_FOCUSED_CHANGED, listener);
    };
  },
  updateThemeValues: (themeValues: {
    backgroundRoot: string;
    foregroundDefault: string;
  }) => ipcRenderer.send(events.THEME_VALUES_CHANGED, themeValues),
  checkForUpdates: () => ipcRenderer.send(events.CHECK_FOR_UPDATES),
  logout: () => ipcRenderer.send(events.LOGOUT),
  platform,
  version,
});
