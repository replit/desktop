import { app, BrowserWindow } from "electron";
import { isWindows } from "./platform";
import { baseUrl, events, protocol } from "./constants";
import path from "path";
import { createSplashScreenWindow } from "./createWindow";

export function registerDeeplinkProtocol(): void {
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

function handleDeeplink(deeplink: string): void {
  console.log(`You arrived from: ${deeplink}`);

  const url = new URL(deeplink);

  // Remove trailing ":"
  if (url.protocol.slice(0, -1) !== protocol) {
    throw new Error("Invalid protocol");
  }

  switch (url.hostname) {
    case "authComplete":
      handleAuthComplete(url.searchParams.get("authToken"));

      break;
    default:
      console.log("Unrecognized hostname");
  }
}

function handleAuthComplete(authToken: string) {
  const windows = BrowserWindow.getAllWindows();
  const authUrl = `${baseUrl}/desktopApp/auth`;

  // If we already have the auth window open which triggered
  // this flow, then we will pass the auth token to it via IPC.
  const authWindow = windows.find(
    (window) => window.webContents.getURL() === authUrl
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

    createSplashScreenWindow({
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

export function setOpenDeeplinkListeners(): void {
  // Windows fires a different event when deeplinks are opened
  // See docs: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
  if (isWindows()) {
    app.on("second-instance", (_event, commandLine) => {
      // the commandLine is an array of strings in which the last element is the deep link url
      const url = commandLine.pop();

      handleDeeplink(url);
    });

    return;
  }

  // Handle the protocol. In this case, we choose to show an Error Box.
  app.on("open-url", (_event, url) => {
    handleDeeplink(url);
  });
}
