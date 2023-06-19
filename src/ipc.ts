import { BrowserWindow, dialog, ipcMain, shell } from "electron";
import { createFullWindow, createSplashScreenWindow } from "./createWindow";
import { baseUrl, events } from "./constants";

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
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id
    );
    senderWindow.close();
  });

  ipcMain.on(events.CONFIRM_CLOSE_CURRENT_WINDOW, (event, message) => {
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id
    );

    dialog
      .showMessageBox(senderWindow, {
        type: "warning",
        message,
        buttons: ["Close", "Cancel"],
        defaultId: 1,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          senderWindow.close();
        }
      });
  });

  ipcMain.on(events.OPEN_REPL_WINDOW, (_, replSlug) => {
    const url = `${baseUrl}${replSlug}`;
    createFullWindow({ url });
  });

  ipcMain.on(events.OPEN_SPLASH_SCREEN_WINDOW, () => {
    createSplashScreenWindow();
  });

  ipcMain.on(events.OPEN_EXTERNAL_URL, (_, url) => {
    shell.openExternal(url);
  });

  // When logging out we have to close all the windows, and do the actual logout navigation in a splash window
  ipcMain.on(events.LOGOUT, () => {
    const url = `${baseUrl}/logout?goto=/desktopApp/login`;

    BrowserWindow.getAllWindows().forEach((win) => win.close());
    createSplashScreenWindow({ url });
  });
}
