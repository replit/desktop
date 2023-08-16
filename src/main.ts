import { app, Menu, BrowserWindow } from "electron";
import { createWindow } from "./createWindow";
import { appName, macAppIcon } from "./constants";
import { isMac } from "./platform";
import { initSentry } from "./sentry";
import { createApplicationMenu, createDockMenu } from "./createMenu";
import checkForUpdates from "./checkForUpdates";
import { registerDeeplinkProtocol, setOpenDeeplinkListeners } from "./deeplink";
import { setIpcEventListeners } from "./ipc";
import store from "./store";
import log from "electron-log/main";

// Setup logging
log.initialize({ preload: true });
log.errorHandler.startCatching();

log.info(`Launching app version: ${app.getVersion()}`);
log.info(`Platform: ${process.platform}`);
log.info(`Arch: ${process.arch}`);
log.info(`Args: ${process.argv}`);

// Handles Squirrel (https://github.com/Squirrel/Squirrel.Windows) events on Windows.
// This should run as early in the main process as possible.
// See docs: https://github.com/electron-archive/grunt-electron-installer#handling-squirrel-events
if (require("electron-squirrel-startup")) {
  log.info("electron-squirrel-startup returned true. Quitting the app");

  app.quit();
}

initSentry();
app.setName(appName);
registerDeeplinkProtocol();

const instanceLock = app.requestSingleInstanceLock();

// The return value of this method indicates whether or not this instance
// of your application successfully obtained the lock.
// If it failed to obtain the lock, you can assume that another instance
// of your application is already running with the lock and exit immediately.
if (!instanceLock) {
  log.info("Failed to acquire instance lock. Quitting the app.");

  app.quit();
}

Menu.setApplicationMenu(createApplicationMenu());

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.info("App Ready");

  // MacOS only APIs
  if (isMac()) {
    app.dock.setIcon(macAppIcon);
    app.dock.setMenu(createDockMenu());
  }

  setOpenDeeplinkListeners();
  setIpcEventListeners();

  createWindow({ url: store.getLastOpenRepl() });
  checkForUpdates();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
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
