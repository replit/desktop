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

function getWindowBounds() {
  const windowBounds = store.getBounds();
  return windowBounds ? windowBounds : screen.getPrimaryDisplay().workArea;
}

interface BaseWindowProps {
  url: string;
  constructorOptions?: BrowserWindowConstructorOptions;
}

function createBaseWindow({
  url,
  constructorOptions,
}: BaseWindowProps): BrowserWindow {
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
    ...constructorOptions,
  });

  // Add a custom string to user agent to make it easier to differentiate requests from desktop app
  window.webContents.setUserAgent(
    `${window.webContents.getUserAgent()} ReplitDesktop`
  );

  window.webContents.setWindowOpenHandler((details) => {
    const url = new URL(details.url);
    const isReplit = url.origin === "https://replit.com";
    const isReplCo = url.host.endsWith("repl.co");

    if (!isReplit && !isReplCo) {
      shell.openExternal(details.url);

      return {
        action: "deny",
      };
    }

    return {
      action: "allow",
    };
  });

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    const url = new URL(navigationUrl);

    const isReplit = url.origin === "https://replit.com";
    const isLocalReplit = process.env.USE_LOCAL_URL
      ? url.origin === "http://localhost:3000"
      : false;
    const isSignup = url.pathname === "/signup";
    const isSupport = url.pathname === "/support";

    // Prevent navigation away from Replit
    if (!(isReplit || isLocalReplit) || isSignup || isSupport) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  window.loadURL(url);

  return window;
}

interface WindowProps {
  url: string;
}

export function createSplashScreenWindow(props?: WindowProps): void {
  const url =
    props?.url ||
    `${baseUrl}/login?isInDesktopApp=true&goto=/desktop?isInDesktopApp=true`;

  const window = createBaseWindow({
    url,
    constructorOptions: {
      titleBarStyle: "hidden",
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreen: false,
    },
  });

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 480;
  const height = 640;

  const bounds = {
    x: Math.round(workArea.width / 2 - width / 2),
    y: Math.round(workArea.height / 2 - height / 2),
    width,
    height,
  };

  window.setBounds(bounds);
  window.setWindowButtonVisibility(false);
}

export function createFullWindow({ url }: WindowProps): void {
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

  const window = createBaseWindow({
    url,
    constructorOptions: platformStyling,
  });

  window.setBounds(getWindowBounds());

  window.on("close", async () => {
    // We're capturing the background color to use as main browser window background color.
    const backgroundColor = await window.webContents.executeJavaScript(
      `getComputedStyle(document.body).getPropertyValue('--background-root');`
    );
    store.setLastSeenBackgroundColor(backgroundColor);
    store.setBounds(window.getBounds());
  });
}
