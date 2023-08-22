import * as Sentry from '@sentry/electron';
import { app, autoUpdater, dialog } from 'electron';
import { isProduction } from './constants';
import { isLinux, isMac } from './platform';
import log from 'electron-log/main';

// We need this to differentiate between M1 and Intel Macs
const platform =
  isMac() && process.arch === 'arm64' ? 'darwin_arm64' : process.platform;
const server = 'https://desktop.replit.com';
const url = `${server}/update/${platform}/${app.getVersion()}`;
const thirtyMinInMs = 30 * 60 * 1000;
const maxCheckLimit = 10;

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
    log.error(
      'Skipping auto-update. setFeedURL threw with the following error: ',
      e,
    );

    return;
  }

  let interval: NodeJS.Timer = null;
  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info' as const,
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'New Update Available',
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    };

    clearInterval(interval);

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      log.info('Update dialog selected: ', returnValue);

      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (message) => {
    log.error('There was a problem updating the application');
    log.error(message);

    const error = new Error('Failed to auto-update the application');

    Sentry.captureException(error, {
      extra: {
        message,
      },
    });
  });

  function checkForUpdate() {
    log.info('Checking for updates');
    autoUpdater.checkForUpdates();
  }

  // Check for updates once at startup and then once every 30 mins
  // that the app is open until we receive an update
  checkForUpdate();

  let check = 0;
  interval = setInterval(() => {
    check++;

    if (check > maxCheckLimit) {
      return;
    }

    checkForUpdate();
  }, thirtyMinInMs);
}
