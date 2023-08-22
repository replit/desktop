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

  let timeout: NodeJS.Timer = null;
  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info' as const,
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'New Update Available',
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    };

    // We downloaded an update so it's safe to stop trying because the user will either accept
    // and reload or defer the update until later in which case we should not show it again.
    clearTimeout(timeout);
    log.info('Update downloaded');

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      log.info(
        'Update dialog selected: ',
        dialogOpts.buttons[returnValue.response],
      );

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

  const thirtyMinInMs = 30 * 60 * 1000;
  const oneDayInMs = 24 * 60 * 60 * 1000;
  function tryCheckForUpdates() {
    log.info('Checking for updates');
    autoUpdater.checkForUpdates();
  }

  function scheduleCheckForUpdates(attempt = 1) {
    timeout = setTimeout(
      () => {
        tryCheckForUpdates();
        scheduleCheckForUpdates(Math.min(attempt + 1, 10));
      },
      // exponential backoff from 1/2 hour until we reach 24 hours
      Math.max(thirtyMinInMs * 2 ** (attempt - 1), oneDayInMs),
    );
  }

  // Check for updates once on launch and then keep retrying
  tryCheckForUpdates();
  scheduleCheckForUpdates();
}
