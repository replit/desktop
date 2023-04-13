import { BrowserWindow, screen, shell } from "electron";
import { appIcon as icon, preloadScript as preload } from "./constants";
import store from "./store";

export default function createWindow(): void {
  let windowBounds = store.get("bounds");

  if (!windowBounds) {
    // If no previous window size was found, create a window that fills the screen's available work area, padded slightly
    const workArea = screen.getPrimaryDisplay().workArea;
    const padding = 16;

    windowBounds = {
      x: workArea.x + padding,
      y: workArea.y + padding,
      width: workArea.width - padding * 2,
      height: workArea.height - padding * 2,
    };
  }

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
  });

  window.setBounds(windowBounds);

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

  window.on("close", () => {
    store.set("bounds", window.getBounds());
  });

  window.loadURL(url);
}
