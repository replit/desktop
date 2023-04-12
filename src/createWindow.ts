import { BrowserWindow, screen, shell } from "electron";
import { appIcon as icon, preloadScript as preload } from "./constants";

export default function createWindow(): void {
  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const title = "Replit";
  const url = "https://replit.com/login?goto=/desktop?isInDesktopApp=true";
  // var(--background-root) value in Dark mode
  const backgroundColor = "#0E1525";
  // MacOS only
  const scrollBounce = true;

  const window = new BrowserWindow({
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

  // Add a custom string to user agent to make it easier to differentiate requests from desktop app
  window.webContents.setUserAgent(
    `${window.webContents.getUserAgent()} ReplitDesktop`
  );

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    const url = new URL(navigationUrl);

    // Prevent navigation away from Replit or to the signup page.
    if (url.origin !== "https://replit.com" || url.pathname === "/signup") {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  window.loadURL(url);
}
