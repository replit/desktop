import {
  app,
  clipboard,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import { baseUrl, isProduction } from './constants';
import { createWindow } from './createWindow';
import { isMac } from './platform';

const replUrlRegExp = new RegExp(`${baseUrl}/@[^/]+/.+`);

const newWindowMenuItem = {
  label: 'New Window',
  accelerator: 'CommandOrControl+Shift+N',
  click: () => createWindow(),
};

const openReplFromClipboardMenuItem = {
  label: 'Open Repl URL from Clipboard',
  click: () => {
    const clipboardText = clipboard.readText();
    const isReplUrl = replUrlRegExp.test(clipboardText);

    if (isReplUrl) {
      createWindow({ url: clipboardText });
    } else {
      dialog.showMessageBox({
        type: 'warning' as const,
        message: 'The URL in Clipboard is not a Repl URL',
      });
    }
  },
};

export function createDockMenu(): Menu {
  const menu = new Menu();

  menu.append(new MenuItem(newWindowMenuItem));
  menu.append(new MenuItem(openReplFromClipboardMenuItem));

  return menu;
}

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
      openReplFromClipboardMenuItem,
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
  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      // Don't expose dev tools in production
      ...(!isProduction ? [{ role: 'toggleDevTools' }] : []),
      { type: 'separator' },
      { type: 'separator' },
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

  const menu = Menu.buildFromTemplate(template as Array<MenuItemConstructorOptions>);

  return menu;
}
