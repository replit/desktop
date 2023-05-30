import { app } from "electron";
import { isWindows } from "./platform";
import { baseUrl, protocol } from "./constants";
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
  const url = `${baseUrl}/desktopApp/login?authToken=${authToken}`;
  createSplashScreenWindow({
    url,
  });
}

export function setOpenDeeplinkListeners(): void {
  // Windows fires a different event when deeplinks are opened
  // See docs: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
  if (isWindows()) {
    app.on("second-instance", (_event, commandLine) => {
      // the commandLine is array of strings in which last element is deep link url
      // the url str ends with /
      const url = commandLine.pop().slice(0, 1);

      handleDeeplink(url);
    });

    return;
  }

  // Handle the protocol. In this case, we choose to show an Error Box.
  app.on("open-url", (_event, url) => {
    handleDeeplink(url);
  });
}
