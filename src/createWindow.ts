import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  shell,
} from "electron";
import { appIcon as icon, preloadScript as preload } from "./constants";
import { isMac } from "./platform";
import store from "./store";

// var(--background-root) value for dark mode
const DEFAULT_BG_COLOR = "#0E1525";

// Used to be able to start the app connecting to local Replit instance
function generateReplitURL() {
  const path = "/login?goto=/desktop?isInDesktopApp=true";

  if (process.env.USE_LOCAL_URL) {
    return `http://localhost:3000${path}`;
  } else {
    return `https://replit.com${path}`;
  }
}

function getWindowBounds() {
  const windowBounds = store.get("bounds");

  return windowBounds ? windowBounds : screen.getPrimaryDisplay().workArea;
}

export default function createWindow(): void {
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
    ...platformStyling,
  });

  window.setBounds(getWindowBounds());

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

  window.on("close", async () => {
    // We're capturing the background color to use as main browser window background color.
    const backgroundColor = await window.webContents.executeJavaScript(
      `getComputedStyle(document.body).getPropertyValue('--background-root');`
    );
    store.set("lastSeenBackgroundColor", backgroundColor);

    store.set("bounds", window.getBounds());
  });

  window.loadURL(url);
}
