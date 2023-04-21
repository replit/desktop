import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  shell,
} from "electron";
import {
  appIcon as icon,
  baseUrl,
  preloadScript as preload,
} from "./constants";
import { isMac } from "./platform";
import store from "./store";

// var(--background-root) value for dark mode
const DEFAULT_BG_COLOR = "#0E1525";

// Used to be able to start the app connecting to local Replit instance
function generateReplitDesktopUrl() {
  return `${baseUrl}/login?goto=/desktop?isInDesktopApp=true`;
}

function getWindowBounds() {
  const windowBounds = store.getBounds();
  return windowBounds ? windowBounds : screen.getPrimaryDisplay().workArea;
}

export function createSplashWindow(): void {
  const title = "Replit";

  const backgroundColor = (store.getLastSeenBackgroundColor() ||
    DEFAULT_BG_COLOR) as string;

  // MacOS only
  const scrollBounce = true;

  const window = new BrowserWindow({
    webPreferences: {
      preload,
      scrollBounce,
    },
    title,
    icon,
    backgroundColor,
    titleBarStyle: "hidden",
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreen: false,

    // Note: experimental macOS 'vibrancy' settings below, note that this requires us to
    // _not_ use a background-color for things that we want to be transparent
    //
    // transparent: true,
    // backgroundColor: "#00000000",
    // visualEffectState: "followWindow",
    // vibrancy: "titlebar",
  });

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 480;
  const height = 540;

  const bounds = {
    x: Math.round(workArea.width / 2 - width / 2),
    y: Math.round(workArea.height / 2 - height / 2),
    width,
    height,
  };

  window.setBounds(bounds);
  window.setWindowButtonVisibility(false);
  window.loadURL(generateReplitDesktopUrl());
}

interface FullWindowProps {
  url: string;
}

export function createFullWindow({ url }: FullWindowProps): void {
  const title = "Replit";
  const backgroundColor = (store.getLastSeenBackgroundColor() ||
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

    const isReplit = url.origin === "https://replit.com";
    const isLocalReplit = process.env.USE_LOCAL_URL
      ? url.origin === "http://localhost:3000"
      : false;
    const isSignup = url.pathname === "/signup";

    // Prevent navigation away from Replit or to the signup page.
    if (!(isReplit || isLocalReplit) || isSignup) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  window.on("close", async () => {
    // We're capturing the background color to use as main browser window background color.
    const backgroundColor = await window.webContents.executeJavaScript(
      `getComputedStyle(document.body).getPropertyValue('--background-root');`
    );
    store.setLastSeenBackgroundColor(backgroundColor);
    store.setBounds(window.getBounds());
  });

  window.loadURL(url);
}
