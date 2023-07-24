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
  workspaceUrlRegex,
  homePage,
} from "./constants";
import { events } from "./events";
import { isMac } from "./platform";
import store from "./store";

interface WindowProps {
  url?: string;
}

const defaultUrl = `${baseUrl}/desktopApp/auth`;

function createURL(url?: string) {
  if (url) {
    return url.startsWith("/") ? `${baseUrl}${url}` : url;
  }

  return defaultUrl;
}

export function createWindow(props?: WindowProps): BrowserWindow {
  const backgroundColor = store.getLastSeenBackgroundColor();
  const url = createURL(props?.url);

  // For MacOS we use a hidden titlebar and move the traffic lights into the header of the interface
  // the corresponding CSS adjustments to enable that live in the repl-it-web repo!
  const platformStyling: BrowserWindowConstructorOptions = isMac()
    ? {
        titleBarStyle: "hidden",
        titleBarOverlay: {
          color: "var(--background-root)",
          symbolColor: "var(--foreground-default)",
          height: 48,
        },
        trafficLightPosition: { x: 20, y: 16 },
      }
    : {};

  const window = new BrowserWindow({
    webPreferences: {
      preload,
      additionalArguments: [`--app-version=${app.getVersion()}`],
      scrollBounce: true, // MacOS only
    },
    title,
    icon,
    minWidth: 500,
    minHeight: 420,
    backgroundColor,
    autoHideMenuBar: true, // Window & Linux only, hides the menubar unless `Alt` is held
    ...platformStyling,
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

  window.webContents.on("did-navigate-in-page", (_event, url) => {
    const u = new URL(url);

    if (u.origin !== baseUrl) {
      return;
    }

    if (u.pathname === homePage) {
      if (store.getLastOpenRepl() != null) {
        store.setLastOpenRepl(null);
      }

      return;
    }

    if (!workspaceUrlRegex.test(u.pathname)) {
      return;
    }

    const lastOpenRepl = store.getLastOpenRepl();

    if (lastOpenRepl === u.pathname) {
      return;
    }

    store.setLastOpenRepl(u.pathname);
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

  window.setBounds(store.getWindowBounds());

  window.on("close", async () => {
    // We're capturing the background color to use as main browser window background color.
    const backgroundColor = await window.webContents.executeJavaScript(
      `getComputedStyle(document.body).getPropertyValue('--background-root');`
    );
    store.setLastSeenBackgroundColor(backgroundColor);
    store.setWindowBounds(window.getBounds());
  });

  window.on("enter-full-screen", () => {
    window.webContents.send(events.ON_ENTER_FULLSCREEN);
  });

  window.on("leave-full-screen", () => {
    window.webContents.send(events.ON_LEAVE_FULLSCREEN);
  });

  // Bypass the browser's cache when initially loading the remote URL
  // in order to ensure that we load the latest web build.
  // See: https://github.com/electron/electron/issues/1360#issuecomment-156506130
  window.loadURL(url, { extraHeaders: "pragma: no-cache\n" });

  return window;
}
