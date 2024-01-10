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

async function getUserInfo() {
  const existingUser = await ipcRenderer.invoke(events.GET_USER_INFO);

  // We already have metadata about the user in our store so we don't need to refetch
  if (existingUser) {
    return;
  }

  const baseUrl = new URL(window.location.href).origin;
  const isAuthenticatedUrl = `${baseUrl}/is_authenticated`;

  const res = await fetch(isAuthenticatedUrl);
  const { success, user } = await res.json();

  // Not authed yet. Ignore and retry next time the script is loaded.
  if (!success) {
    return;
  }

  if (!user) {
    throw new Error('Expected user');
  }

  const { id, username, email } = user;

  if (!id || !username || !email) {
    throw new Error('Expected id, username, and email');
  }

  ipcRenderer.send(events.UPDATE_USER_INFO, {
    id,
    username,
    email,
  });
}

getUserInfo();

interface SyncLocalDirectoryParams {
  remoteDirectory: string;
  localDirectory: string;
  sshUser: string;
  sshHostname: string;
  sshPort: string;
}

interface ExitLocalDirectorySync {
  pid: number;
}

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
  showOpenDirectoryDialog: async () =>
    ipcRenderer.invoke(events.SHOW_OPEN_DIRECTORY_DIALOG),
  syncLocalDirectory: (params: SyncLocalDirectoryParams) => {
    return ipcRenderer.invoke(events.SYNC_LOCAL_DIRECTORY, params);
  },
  stopLocalDirectorySync: (params: ExitLocalDirectorySync) => {
    return ipcRenderer.invoke(events.STOP_LOCAL_DIRECTORY_SYNC, params);
  },
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
  generateSSHKeys: async () => ipcRenderer.invoke(events.GENERATE_SSH_KEYS),
  logout: () => ipcRenderer.send(events.LOGOUT),
  platform,
  version,
});
