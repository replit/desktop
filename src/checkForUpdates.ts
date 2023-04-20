import { app, autoUpdater, dialog } from "electron";
import { isLinux, isWindows } from "./platform";

const server = "https://desktop-app-releases.replit.app";
const url = `${server}/update/${process.platform}/${app.getVersion()}`;

export default function checkForUpdates(): void {
  // The app must be packaged in order to check for updates.
  if (!app.isPackaged) {
    return;
  }

  // The autoUpdater module does not support Linux
  if (isLinux()) {
    return;
  }

  autoUpdater.setFeedURL({ url });

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
  });

  autoUpdater.checkForUpdates();
}
