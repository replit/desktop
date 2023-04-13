import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  shell,
} from "electron";
import { appIcon as icon, preloadScript as preload } from "./constants";
import { isMac } from "./platform";
import store from "./store";

const DEFAULT_BG_COLOR = "#0E1525";

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
  const backgroundColor = (store.get("lastSeenBackgroundColor") ||
    DEFAULT_BG_COLOR) as string;

  // MacOS only
  const scrollBounce = true;

  // For MacOS we use a hidden titlebar and move the traffic lights into the header of the interface
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

  window.webContents.on("did-navigate-in-page", async () => {
    // We're capturing the background color to use as main browser window background color.
    // Doing this with `did-navigate-in-page` is not ideal (changing the color theme from the settings pane **does not** navigate),
    // ideally we'd have some way to pass events from the browser application, but for now this is better than nothing.
    const backgroundColor = await window.webContents.executeJavaScript(`
      getComputedStyle(document.body).getPropertyValue('--background-root');
      `);
    store.set("lastSeenBackgroundColor", backgroundColor);
  });

  window.loadURL(url);
}
