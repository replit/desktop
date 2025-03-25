import {
  app,
  clipboard,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import { isProduction } from './constants';
import { createWindow } from './createWindow';
import { handleAuthComplete } from './deeplink';
import { isMac } from './platform';

const newWindowMenuItem = {
  label: 'New Window',
  accelerator: 'CommandOrControl+N',
  click: () => createWindow(),
};

const completeAuthFromClipboardMenuItem = {
  label: 'Complete Auth From Clipboard',
  click: () => completeAuthFromClipboard(),
};

// we use deeplinking for authentication, but deeplinks are not supported in
// unpackaged macOS and Linux builds, this is a dev-only workaround to finish
// the authentication flow by copying the auth url into a clipboard
async function completeAuthFromClipboard() {
  const maybeUrl = clipboard.readText();

  function showUrlInvalidDialog(url: string) {
    dialog.showErrorBox(
      'Authentication Error',
      `The URL in the clipboard is not valid: ${url}`,
    );
  }

  try {
    const url = new URL(maybeUrl);
    const authToken = url.searchParams.get('authToken');

    if (url.pathname === '/desktopApp/authSuccess' && authToken?.length > 0) {
      handleAuthComplete(authToken);
    } else {
      showUrlInvalidDialog(maybeUrl);
    }
  } catch (e) {
    showUrlInvalidDialog(maybeUrl);
  }
}

export function createDockMenu(): Menu {
  const menu = new Menu();

  menu.append(new MenuItem(newWindowMenuItem));

  return menu;
}

const allowDevtools = !isProduction || process.env.ENABLE_DEVTOOLS;

export function createApplicationMenu(): Menu {
  const template = [];

  // App Menu
  if (isMac()) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  // File Menu
  template.push({
    label: 'File',
    submenu: [
      newWindowMenuItem,
      !isProduction ? completeAuthFromClipboardMenuItem : [],
      { type: 'separator' },
      isMac() ? { role: 'close' } : { role: 'quit' },
    ],
  });

  // Edit Menu
  template.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' },
    ],
  });

  // View Menu
  const devOnlyViewMenuItems = [
    { role: 'reload' },
    { role: 'forceReload' },
    { type: 'separator' },
  ];
  template.push({
    label: 'View',
    submenu: [
      ...(!isProduction ? devOnlyViewMenuItems : []),
      ...(allowDevtools ? [{ role: 'toggleDevTools' }] : []),
      { role: 'togglefullscreen' },
    ],
  });

  // Window Menu
  template.push({
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac()
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
          ]
        : [{ role: 'close' }]),
    ],
  });

  // Help Menu
  template.push({
    role: 'help',
  });

  const menu = Menu.buildFromTemplate(
    template as Array<MenuItemConstructorOptions>,
  );

  return menu;
}
