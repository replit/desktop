import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  shell,
  app,
  Rectangle,
} from 'electron';
import {
  appIcon as icon,
  appName as title,
  baseUrl,
  preloadScript as preload,
  workspaceUrlRegex,
  homePage,
  isProduction,
} from './constants';
import log from 'electron-log/main';
import { events } from './events';
import isSupportedPage from './isSupportedPage';
import { isMac, isWindows } from './platform';
import store from './store';

interface WindowProps {
  url?: string | null;
}

const defaultUrl = `${baseUrl}${homePage}`;

function createURL(url?: string | null) {
  if (url) {
    return url.startsWith('/') ? `${baseUrl}${url}` : url;
  }

  return defaultUrl;
}

function setLastOpenRepl(url: string, lastOpenRepl: string | null) {
  if (!url) {
    return;
  }

  const u = new URL(url);

  if (u.origin !== baseUrl) {
    return;
  }

  if (u.pathname === homePage) {
    if (lastOpenRepl != null) {
      store.setLastOpenRepl(null);
    }

    return;
  }

  if (!workspaceUrlRegex.test(u.pathname)) {
    return;
  }

  if (lastOpenRepl === u.pathname) {
    return;
  }

  store.setLastOpenRepl(u.pathname);
}

function isInBounds(rect: Rectangle) {
  return screen.getAllDisplays().some(({ bounds }) => {
    const { x, y, width, height } = bounds;

    // Allow some leeway in case the app is barely off the screen
    const maxX = x + width + 100;
    const maxY = y + height + 100;

    return maxX >= rect.x + rect.width && maxY >= rect.y + rect.height;
  });
}

function updateStoreWithFocusedWindowValues() {
  const windows = BrowserWindow.getAllWindows();

  // No existing windows open so there's nothing to update
  if (windows.length === 0) {
    return;
  }

  // Grab the focused window or the first we see if there isn't one
  const window = BrowserWindow.getFocusedWindow() || windows[0];

  store.setWindowBounds(window.getBounds());
}

function getPlatformSpecificStyling({
  backgroundColor,
  foregroundColor,
}: {
  backgroundColor: string;
  foregroundColor: string;
}): Partial<BrowserWindowConstructorOptions> {
  // For MacOS and Windows we use a hidden titlebar and move the OS window buttons into the header of the interface
  // the corresponding CSS adjustments to enable this live in the repl-it-web repo.
  if (isMac()) {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: { height: 48 },
      trafficLightPosition: { x: 20, y: 16 },
    };
  }

  if (isWindows()) {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: backgroundColor,
        symbolColor: foregroundColor,
        height: 47, // leaving 1px for border on the top of the pane
      },
    };
  }

  return {};
}

export function createWindow(props?: WindowProps): BrowserWindow {
  updateStoreWithFocusedWindowValues();
  const backgroundColor = store.getLastSeenBackgroundColor();
  const foregroundColor = store.getLastSeenForegroundColor();
  const url = createURL(props?.url);
  let lastOpenRepl = store.getLastOpenRepl();
  const disposeOnLastOpenReplChange = store.onLastOpenReplChange((newValue) => {
    lastOpenRepl = newValue;
  });

  log.info('Creating window with URL: ', url);

  const platformStyling = getPlatformSpecificStyling({
    foregroundColor,
    backgroundColor,
  });

  const window = new BrowserWindow({
    webPreferences: {
      preload,
      additionalArguments: [
        `--app-version=${app.getVersion()}`,
        `--platform=${process.platform}`,
      ],
      scrollBounce: true, // MacOS only
    },
    title,
    icon,
    minWidth: 720,
    minHeight: 480,
    backgroundColor,
    autoHideMenuBar: true, // Window & Linux only, hides the menubar unless `Alt` is held
    show: false, // We're starting with the window hidden, as we are still setting it up using imperative methods below
    ...platformStyling,
  });

  // Add a custom string to user agent to make it easier to differentiate requests from desktop app
  const userAgentSuffix = isProduction
    ? 'ReplitDesktop'
    : 'ReplitDesktop (Development)';

  window.webContents.setUserAgent(
    `${window.webContents.getUserAgent()} ${userAgentSuffix}`,
  );

  // Prevent any URLs opened via a target="_blank" anchor tag or programmatically using `window.open` from
  // opening in an Electron window and open in the user's external browser instead.
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return {
      action: 'deny',
    };
  });

  window.webContents.on('did-navigate-in-page', (_event, navigationUrl) => {
    setLastOpenRepl(navigationUrl, lastOpenRepl);
  });

  window.webContents.on('will-navigate', (event, navigationUrl) => {
    const u = new URL(navigationUrl);

    const isReplit = u.origin === baseUrl;

    // Prevent navigation away from Replit or supported pages
    if (!isReplit || !isSupportedPage(u.pathname)) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // If the previous bounds are no longer in-bounds with the current set of
  // displays, then bail and fallback to the default behavior to prevent the app
  // from opening stretched out or sticking outside the screens.
  const inBounds = isInBounds(store.getWindowBounds());

  if (!inBounds) {
    store.clearWindowBounds();
  }

  window.setBounds(store.getWindowBounds());

  window.on('close', () => {
    store.setWindowBounds(window.getBounds());
    disposeOnLastOpenReplChange();
  });

  window.on('focus', () => {
    setLastOpenRepl(url, lastOpenRepl);
  });

  window.on('enter-full-screen', () => {
    window.webContents.send(events.ON_ENTER_FULLSCREEN);
  });

  window.on('leave-full-screen', () => {
    window.webContents.send(events.ON_LEAVE_FULLSCREEN);
  });

  // Bypass the browser's cache when initially loading the remote URL
  // in order to ensure that we load the latest web build.
  // See: https://github.com/electron/electron/issues/1360#issuecomment-156506130
  window.loadURL(url, { extraHeaders: 'pragma: no-cache\n' });

  // We've set up the window, so let's show it!
  window.show();

  return window;
}
