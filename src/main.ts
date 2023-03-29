import { app, BrowserWindow, nativeImage, screen, shell } from "electron";
import * as path from "path";

app.setName("Replit");

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

const icon = nativeImage.createFromPath(
  path.join(__dirname, "assets", "logo.png")
);

function createWindow() {
  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const title = "Replit";
  const url = "https://replit.com/login?goto=/desktop?isDesktopApp=true";
  const preload = path.join(__dirname, "preload.js");
  // var(--background-root) value in Dark mode
  const backgroundColor = "#0E1525";
  // MacOS only
  const scrollBounce = true;

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload,
      scrollBounce,
    },
    backgroundColor,
    title,
    icon,
    width,
    height,
  });

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Prevent navigation away from Replit
    if (parsedUrl.origin !== "https://replit.com") {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  mainWindow.loadURL(url);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (process.platform === "darwin") {
    // MacOS only API
    app.dock.setIcon(icon);
  }

  createWindow();

  app.on("activate", function () {
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
