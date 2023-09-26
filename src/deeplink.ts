import { app, BrowserWindow } from 'electron';
import { isWindows, isLinux } from './platform';
import {
  baseUrl,
  protocol,
  workspaceUrlRegex,
  semverRegex,
  authPage,
  homePage,
} from './constants';
import path from 'path';
import { createWindow } from './createWindow';
import { events } from './events';
import log from 'electron-log/main';

export function initializeDeeplinking(): void {
  registerDeeplinkProtocol();
  setOpenDeeplinkListeners();
}

function registerDeeplinkProtocol(): void {
  log.info('Registering deeplink protocol');

  if (process.defaultApp && isWindows() && process.argv.length >= 2) {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    // Setting this is required to get this working in dev mode.
    app.setAsDefaultProtocolClient(protocol, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    app.setAsDefaultProtocolClient(protocol);
  }
}

function isValidDeeplinkURL(deeplink: string) {
  log.info(`Arrived from deeplink: ${deeplink}`);

  try {
    const url = new URL(deeplink);

    // Remove trailing ":"
    if (url.protocol.slice(0, -1) !== protocol) {
      return false;
    }
  } catch {
    log.warn('Invalid URL for deeplink');

    return false;
  }

  return true;
}

async function handleDeeplink(deeplink: string): Promise<void> {
  const url = new URL(deeplink);

  // We set the listeners before the app is ready to make sure we don't miss any events
  // that triggered the launch of the app so we need to check that the app is ready before
  // using window APIs that will not work until then.
  await app.whenReady();

  switch (url.hostname) {
    case 'authComplete': {
      handleAuthComplete(url.searchParams.get('authToken'));

      break;
    }

    case 'home': {
      handleHome();

      break;
    }

    case 'new': {
      handleNew(url.searchParams.get('language') || 'python3');

      break;
    }

    case 'repl': {
      handleRepl(url.pathname);

      break;
    }

    default: {
      const error = `Unrecognized hostname: ${url.hostname}`;
      log.error(error);
    }
  }
}

function getFocusedOrFirstWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();

  if (windows.length === 0) {
    return null;
  }

  return BrowserWindow.getFocusedWindow() || windows[0];
}

function handleHome() {
  const homeUrl = `${baseUrl}${homePage}`;

  const window = getFocusedOrFirstWindow();

  if (window) {
    window.loadURL(homeUrl);

    return;
  }

  createWindow({
    url: homeUrl,
  });
}

function handleNew(language: string) {
  const url = `${baseUrl}${homePage}?language=${language}`;

  createWindow({
    url,
  });
}

function handleRepl(url: string) {
  if (!workspaceUrlRegex.test(url)) {
    log.error('Expected URL of the format /@username/slug');

    return;
  }

  const window = getFocusedOrFirstWindow();

  if (window) {
    window.loadURL(`${baseUrl}${url}`);

    return;
  }

  createWindow({
    url,
  });
}

function handleAuthComplete(authToken: string) {
  const windows = BrowserWindow.getAllWindows();
  const authUrl = `${baseUrl}${authPage}`;

  // If we already have the auth window open which triggered
  // this flow, then we will pass the auth token to it via IPC.
  const authWindow = windows.find(
    (window) => window.webContents.getURL() === authUrl,
  );

  // Close all other windows that may have been opened during this time.
  BrowserWindow.getAllWindows().forEach((w) => {
    if (authWindow && w.id === authWindow.id) {
      return;
    }

    w.close();
  });

  // Otherwise, if that window was closed for some reason, simply
  // open a new auth window with the token passed in via a query param.
  if (!authWindow) {
    const url = `${authUrl}?authToken=${authToken}`;

    createWindow({
      url,
    });

    return;
  }

  if (authWindow.isMinimized()) {
    authWindow.restore();
  }

  authWindow.focus();

  authWindow.webContents.send(events.AUTH_TOKEN_RECEIVED, authToken);
}

function setOpenDeeplinkListeners(): void {
  log.info('Setting deeplink listeners');

  // Windows and Linux fire a different event when deeplinks are opened
  // See docs: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
  if (isWindows() || isLinux()) {
    app.on('second-instance', (_event, commandLine) => {
      if (commandLine.length === 0) {
        throw new Error('Expected command line arguments');
      }

      // the commandLine is an array of strings in which the last element is the deep link url
      const url = commandLine[commandLine.length - 1];
      const command = commandLine[0];

      // On Windows, the app emits the "second-instance" event after the app auto-updates.
      if (semverRegex.test(url)) {
        return;
      }

      if (!isValidDeeplinkURL(url)) {
        // Linux emits this event when the native "New Window" menu item is triggered
        // where the command line is "replit" followed by a bunch of flags.
        if (isLinux() && command === protocol) {
          createWindow();
        }

        return;
      }

      handleDeeplink(url);
    });

    return;
  }

  app.on('open-url', (_event, url) => {
    handleDeeplink(url);
  });
}
