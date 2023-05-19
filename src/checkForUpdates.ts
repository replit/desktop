import * as Sentry from "@sentry/electron";
import { app, autoUpdater, dialog } from "electron";
import { isProduction } from "./constants";
import { isLinux, isWindows } from "./platform";

const server = "https://desktop-app-releases.replit.app";
const url = `${server}/update/${process.platform}/${app.getVersion()}`;

export default function checkForUpdates(): void {
  // The app must be packaged in order to check for updates.
  if (!isProduction) {
    return;
  }

  // The autoUpdater module does not support Linux
  if (isLinux()) {
    return;
  }

  try {
    autoUpdater.setFeedURL({ url });
  } catch (e) {
    // This function will throw if the app is not signed which should only happen if you build from source without the appropriate env vars set.
    console.log(
      "Skipping auto-update. setFeedURL threw with the following error: ",
      e
    );

    return;
  }

  autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Application Update",
      // On Windows only releaseName is available.
      message: isWindows() ? releaseName : releaseNotes,
      detail:
        "A new version has been downloaded. Restart the application to apply the updates.",
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("error", (message) => {
    console.error("There was a problem updating the application");
    console.error(message);

    const error = new Error("Failed to auto-update the application");

    Sentry.captureException(error, {
      extra: {
        message,
      },
    });
  });

  autoUpdater.checkForUpdates();
}
