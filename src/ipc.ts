import { autoUpdater, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import log from 'electron-log/main';
import { createWindow } from './createWindow';
import { authPage, baseUrl, isProduction } from './constants';
import { events } from './events';
import { isLinux } from './platform';
import store from './store';
import isSupportedPage from './isSupportedPage';
import { isWindows } from './platform';

function logEvent(event: events, params?: Record<string, unknown>) {
  log.info(
    `Recieved IPC event: ${event}${
      params ? ` with params ${JSON.stringify(params)}` : ''
    }`,
  );
}

/**
 * Set listeners for IPC, or inter-process communication, events that are
 * emitted by the renderer process via the API defined in the preload script.
 *
 * Should be called before the first browser window is opened.
 *
 * See relevant docs for more detail: https://www.electronjs.org/docs/latest/tutorial/ipc
 */
export function setIpcEventListeners(): void {
  ipcMain.on(events.CLOSE_CURRENT_WINDOW, (event) => {
    logEvent(events.CLOSE_CURRENT_WINDOW);
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id,
    );
    senderWindow.close();
  });

  ipcMain.on(events.OPEN_WINDOW, (_, slug) => {
    logEvent(events.OPEN_WINDOW, { slug });
    if (!isSupportedPage(slug)) {
      throw new Error('Page not supported');
    }

    const url = `${baseUrl}${slug}`;
    createWindow({ url });
  });

  ipcMain.on(events.OPEN_EXTERNAL_URL, (_, url) => {
    logEvent(events.OPEN_EXTERNAL_URL, { url });
    shell.openExternal(url);
  });

  // When logging out we have to close all the windows, and do the actual logout navigation in a splash window
  ipcMain.on(events.LOGOUT, () => {
    logEvent(events.LOGOUT);
    store.setLastOpenRepl(null);
    const url = `${baseUrl}/logout?goto=${authPage}`;

    BrowserWindow.getAllWindows().forEach((win) => win.close());
    createWindow({ url });
  });

  ipcMain.on(events.CHECK_FOR_UPDATES, () => {
    logEvent(events.CHECK_FOR_UPDATES);

    if (!isProduction) {
      return;
    }

    if (!isLinux()) {
      return;
    }

    autoUpdater.checkForUpdates();
  });

  ipcMain.handle(events.SHOW_MESSAGE_BOX, async (event, params) => {
    logEvent(events.SHOW_MESSAGE_BOX, params);
    const { response } = await dialog.showMessageBox(params);

    return response;
  });

  ipcMain.on(events.THEME_VALUES_CHANGED, (event, themeValues) => {
    logEvent(events.THEME_VALUES_CHANGED, themeValues);

    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id,
    );

    const { backgroundRoot, foregroundDefault } = themeValues;

    senderWindow.setBackgroundColor(backgroundRoot);

    store.setLastSeenBackgroundColor(backgroundRoot);
    store.setLastSeenForegroundColor(foregroundDefault);

    if (isWindows()) {
      senderWindow.setTitleBarOverlay({
        color: backgroundRoot,
        symbolColor: foregroundDefault,
      });
    }
  });
}
