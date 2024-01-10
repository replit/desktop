import {
  app,
  autoUpdater,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
} from 'electron';
import log from 'electron-log/main';
import { createWindow } from './createWindow';
import { authPage, baseUrl, isProduction } from './constants';
import { events } from './events';
import { isLinux } from './platform';
import store from './store';
import { setSentryUser } from './sentry';
import isSupportedPage from './isSupportedPage';
import { isWindows } from './platform';
import { spawn, exec } from 'child_process';

function logEvent(event: events, params?: Record<string, unknown>) {
  log.info(
    `Recieved IPC event: ${event}${
      params ? ` with params ${JSON.stringify(params)}` : ''
    }`,
  );
}

/**
 * Set listeners for IPC, or inter-process communication, events that are
 * emitted by the renderer process via the API defined in the preload script.
 *
 * Should be called before the first browser window is opened.
 *
 * See relevant docs for more detail: https://www.electronjs.org/docs/latest/tutorial/ipc
 */
export function setIpcEventListeners(): void {
  ipcMain.on(events.CLOSE_CURRENT_WINDOW, (event) => {
    logEvent(events.CLOSE_CURRENT_WINDOW);
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id,
    );
    senderWindow.close();
  });

  ipcMain.on(events.OPEN_WINDOW, (_, slug) => {
    logEvent(events.OPEN_WINDOW, { slug });
    if (!isSupportedPage(slug)) {
      throw new Error('Page not supported');
    }

    const url = `${baseUrl}${slug}`;
    createWindow({ url });
  });

  ipcMain.on(events.OPEN_EXTERNAL_URL, (_, url) => {
    logEvent(events.OPEN_EXTERNAL_URL, { url });
    shell.openExternal(url);
  });

  // When logging out we have to close all the windows, and do the actual logout navigation in a splash window
  ipcMain.on(events.LOGOUT, () => {
    logEvent(events.LOGOUT);
    store.setLastOpenRepl(null);
    store.setUser(null);
    setSentryUser(null);

    const url = `${baseUrl}/logout?goto=${authPage}`;

    BrowserWindow.getAllWindows().forEach((win) => win.close());
    createWindow({ url });
  });

  ipcMain.on(events.CHECK_FOR_UPDATES, () => {
    logEvent(events.CHECK_FOR_UPDATES);

    if (!isProduction) {
      return;
    }

    if (!isLinux()) {
      return;
    }

    autoUpdater.checkForUpdates();
  });

  ipcMain.handle(events.SHOW_MESSAGE_BOX, async (event, params) => {
    logEvent(events.SHOW_MESSAGE_BOX, params);
    const { response } = await dialog.showMessageBox(params);

    return response;
  });

  ipcMain.handle(events.SHOW_OPEN_DIRECTORY_DIALOG, async (event) => {
    logEvent(events.SHOW_OPEN_DIRECTORY_DIALOG);
    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id,
    );

    const response = await dialog.showOpenDialog(senderWindow, {
      properties: ['openDirectory', 'showHiddenFiles'],
      defaultPath: '/',
    });

    return response;
  });

  ipcMain.handle(events.STOP_LOCAL_DIRECTORY_SYNC, async (event, params) => {
    logEvent(events.STOP_LOCAL_DIRECTORY_SYNC, params);
    const { pid } = params;

    if (!pid) {
      return false;
    }

    const directory = store.getLocalSyncDirForPid(pid);

    if (!directory) {
      return false;
    }

    log.info(`Running kill ${pid}`);
    process.kill(pid);

    log.info(`Running umount ${directory}`);
    const umount = spawn('umount', [directory]);

    umount.stdout.on('data', (data) => {
      log.info(`umount stdout: ${data}`);
    });

    umount.stderr.on('data', (data) => {
      log.error(`umount stderr: ${data}`);
    });

    umount.on('close', (code) => {
      log.warn(`umount child process exited with code ${code}`);
    });

    return true;
  });

  ipcMain.handle(events.GENERATE_SSH_KEYS, async () => {
    logEvent(events.GENERATE_SSH_KEYS);

    const home = app.getPath('home');

    return new Promise((resolve) => {
      const command = `[ -s ${home}/.ssh/replit.pub ] || ssh-keygen -t ed25519 -f ${home}/.ssh/replit -q -N "" && cat ${home}/.ssh/replit.pub`;
      log.info(`Generating keys with command: ${command}`);
      exec(command, (_error, stdout) => {
        log.info(`Resolving keygen with output: ${stdout}`);
        resolve(stdout);
      });
    });
  });

  ipcMain.handle(events.SYNC_LOCAL_DIRECTORY, async (event, params) => {
    logEvent(events.SYNC_LOCAL_DIRECTORY, params);

    const { localDirectory, remoteDirectory, sshUser, sshHostname, sshPort } =
      params;

    const home = app.getPath('home');

    log.info('Spawning sshfs');
    const sshfs = spawn('sshfs', [
      `${sshUser}@${sshHostname}:${remoteDirectory}/`,
      localDirectory,
      '-p',
      sshPort,
      '-o',
      `IdentityFile=${home}/.ssh/replit`,
      '-o',
      'allow_other,default_permissions,debug',
    ]);

    log.info(`Started process: ${sshfs.pid}`);

    sshfs.stdout.on('data', (data) => {
      log.info(`sshfs stdout: ${data}`);
    });

    sshfs.stderr.on('data', (data) => {
      log.error(`sshfs stderr: ${data}`);
    });

    sshfs.on('close', (code) => {
      log.warn(`sshfs child process exited with code ${code}`);
    });

    store.setLocalSyncDirForPid(sshfs.pid, localDirectory);

    return sshfs.pid;
  });

  ipcMain.on(events.UPDATE_USER_INFO, async (event, user) => {
    logEvent(events.UPDATE_USER_INFO, user);

    store.setUser(user);
    setSentryUser(user);
  });

  ipcMain.handle(events.GET_USER_INFO, () => {
    logEvent(events.GET_USER_INFO);

    return store.getUser();
  });

  ipcMain.on(events.THEME_VALUES_CHANGED, (event, themeValues) => {
    logEvent(events.THEME_VALUES_CHANGED, themeValues);

    const senderWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id,
    );

    const { backgroundRoot, foregroundDefault } = themeValues;

    // Update store values
    store.setLastSeenBackgroundColor(backgroundRoot);
    store.setLastSeenForegroundColor(foregroundDefault);

    // Update window styling
    senderWindow.setBackgroundColor(backgroundRoot);

    if (isWindows()) {
      senderWindow.setTitleBarOverlay({
        color: backgroundRoot,
        symbolColor: foregroundDefault,
      });
    }
  });
}
