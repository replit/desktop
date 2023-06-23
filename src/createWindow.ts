import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  shell,
  app,
} from "electron";
import {
  appIcon as icon,
  appName as title,
  baseUrl,
  preloadScript as preload,
} from "./constants";
import { events } from "./events";
import { isMac } from "./platform";
import store from "./store";

interface BaseWindowProps {
  url: string;
  constructorOptions?: BrowserWindowConstructorOptions;
}

function createBaseWindow({
  url,
  constructorOptions,
}: BaseWindowProps): BrowserWindow {
  const backgroundColor = store.getLastSeenBackgroundColor();

  const window = new BrowserWindow({
    webPreferences: {
      preload,
      additionalArguments: [`--app-version=${app.getVersion()}`],
      scrollBounce: true, // MacOS only
    },
    title,
    icon,
    backgroundColor,
    autoHideMenuBar: true, // Window & Linux only, hides the menubar unless `Alt` is held
    ...constructorOptions,
  });

  // Add a custom string to user agent to make it easier to differentiate requests from desktop app
  window.webContents.setUserAgent(
    `${window.webContents.getUserAgent()} ReplitDesktop`
  );

  window.webContents.setWindowOpenHandler((details) => {
    const url = new URL(details.url);
    const isReplit = url.origin === baseUrl;
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

    const isReplit = url.origin === baseUrl;
    const isSignup = url.pathname === "/signup";
    const isSupport = url.pathname === "/support";

    // Prevent navigation away from Replit
    if (!isReplit || isSignup || isSupport) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Bypass the browser's cache when initially loading the remote URL
  // in order to ensure that we load the latest web build.
  // See: https://github.com/electron/electron/issues/1360#issuecomment-156506130
  window.loadURL(url, { extraHeaders: "pragma: no-cache\n" });

  return window;
}

interface WindowProps {
  url: string;
}

export function createSplashScreenWindow(props?: WindowProps): BrowserWindow {
  const url = props?.url || `${baseUrl}/desktopApp/auth`;

  const width = 480;
  const height = 640;

  const window = createBaseWindow({
    url,
    constructorOptions: {
      frame: false,
      minimizable: false,
      maximizable: false,
      fullscreen: false,
      minWidth: width,
      minHeight: height,
    },
  });

  const bounds = {
    ...store.getSplashScreenWindowBounds(),
    width,
    height,
  };

  window.setBounds(bounds);

  window.on("close", () => {
    store.setSplashScreenWindowBounds(window.getBounds());
  });

  return window;
}

export function createFullWindow({ url }: WindowProps): BrowserWindow {
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

  window.setBounds(store.getFullWindowBounds());

  window.on("close", async () => {
    // We're capturing the background color to use as main browser window background color.
    const backgroundColor = await window.webContents.executeJavaScript(
      `getComputedStyle(document.body).getPropertyValue('--background-root');`
    );
    store.setLastSeenBackgroundColor(backgroundColor);
    store.setFullWindowBounds(window.getBounds());
  });

  window.on("enter-full-screen", () => {
    window.webContents.send(events.ON_ENTER_FULLSCREEN);
  });

  window.on("leave-full-screen", () => {
    window.webContents.send(events.ON_LEAVE_FULLSCREEN);
  });

  return window;
}
