import { app, dialog } from "electron";
import { isWindows } from "./platform";
import { protocol } from "./constants";
import path from "path";

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

function handleDeeplink(url: string): void {
  // TODO: Redirect somewhere in the app
  dialog.showErrorBox("Welcome Back", `You arrived from: ${url}`);
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
