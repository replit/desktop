import { app, Menu, BrowserWindow, ipcMain } from "electron";
import { createFullWindow, createSplashScreenWindow } from "./createWindow";
import { baseUrl, macAppIcon } from "./constants";
import { isMac } from "./platform";
import { createApplicationMenu, createDockMenu } from "./createMenu";
import checkForUpdates from "./checkForUpdates";
import { registerDeeplinkProtocol, setOpenDeeplinkListeners } from "./deeplink";

// This should run as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

app.setName("Replit");
registerDeeplinkProtocol();

process.on("unhandledRejection", (rejection: Error) => {
  console.error(`[Unhandled Promise Rejction] ${rejection.stack}`);
});

const instanceLock = app.requestSingleInstanceLock();

// The return value of this method indicates whether or not this instance
// of your application successfully obtained the lock.
// If it failed to obtain the lock, you can assume that another instance
// of your application is already running with the lock and exit immediately.
if (!instanceLock) {
  app.quit();
}

const applicationMenu = createApplicationMenu();
const dockMenu = createDockMenu();

Menu.setApplicationMenu(applicationMenu);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // MacOS only APIs
  if (isMac()) {
    app.dock.setIcon(macAppIcon);
    app.dock.setMenu(dockMenu);
  }

  setOpenDeeplinkListeners();
  createSplashScreenWindow();
  checkForUpdates();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashScreenWindow();
    }
  });

  ipcMain.on("CLOSE_CURRENT_WINDOW", (event) => {
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id
    );
    senderWindow.close();
  });

  ipcMain.on("OPEN_REPL_WINDOW", (_, replSlug) => {
    const url = `${baseUrl}${replSlug}?isInDesktopApp=true`;
    createFullWindow({ url });
  });

  // When logging out we have to close all the windows, and do the actual logout navigation in a splash window
  ipcMain.on("LOGOUT", () => {
    const url = `${baseUrl}/logout?goto=/login?isInDesktopApp=true`;

    BrowserWindow.getAllWindows().forEach((win) => win.close());
    createSplashScreenWindow({ url });
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (!isMac()) {
    app.quit();
  }
});
