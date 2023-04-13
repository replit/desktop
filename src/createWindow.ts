import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  shell,
} from "electron";
import { appIcon as icon, preloadScript as preload } from "./constants";
import { isMac } from "./platform";

// used to be able to start the app connecting to local replit instance
function generateReplitURL() {
  const urlPath = "/login?goto=/desktop?isInDesktopApp=true";

  if (process.env.USE_LOCAL_URL === "true") {
    return "http://localhost:3000" + urlPath;
  } else {
    return "https://replit.com" + urlPath;
  }
}

export default function createWindow(): void {
  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const title = "Replit";
  const url = generateReplitURL();
  // var(--background-root) value in Dark mode
  const backgroundColor = "#0E1525";
  // MacOS only
  const scrollBounce = true;

  // for MacOS we use a hidden titlebar and move the traffic lights into the header of the interface
  // the corresponding CSS adjustments to enable that live in the repl-it-web repo!
  const platformStyling: BrowserWindowConstructorOptions = isMac()
    ? {
        titleBarStyle: "hidden",
        titleBarOverlay: {
          color: "var(--background-root)",
          symbolColor: "var(--foreground-default)",
          height: 60,
        },
        trafficLightPosition: { x: 20, y: 22 },
      }
    : {};

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
    ...platformStyling,
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
