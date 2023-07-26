import { BrowserWindow, ipcMain, shell } from "electron";
import { createWindow } from "./createWindow";
import { authPage, baseUrl } from "./constants";
import { events } from "./events";
import store from "./store";
import isSupportedPage from "./isSupportedPage";

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
    // We assume that the Repl window is closing. While that may not be the case here,
    // we reset the state just in case.
    store.setLastOpenRepl(null);
  });

  ipcMain.on(events.OPEN_REPL_WINDOW, (_, slug) => {
    if (!isSupportedPage(slug)) {
      throw new Error("Page not supported");
    }

    const url = `${baseUrl}${slug}`;
    createWindow({ url });
  });

  ipcMain.on(events.OPEN_EXTERNAL_URL, (_, url) => {
    shell.openExternal(url);
  });

  // When logging out we have to close all the windows, and do the actual logout navigation in a splash window
  ipcMain.on(events.LOGOUT, () => {
    store.setLastOpenRepl(null);
    const url = `${baseUrl}/logout?goto=${authPage}`;

    BrowserWindow.getAllWindows().forEach((win) => win.close());
    createWindow({ url });
  });
}
