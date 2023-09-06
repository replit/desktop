import { app, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { isProduction } from './constants';
import { createWindow } from './createWindow';
import { isMac } from './platform';

const newWindowMenuItem = {
  label: 'New Window',
  accelerator: 'CommandOrControl+Shift+N',
  click: () => createWindow(),
};

export function createDockMenu(): Menu {
  const menu = new Menu();

  menu.append(new MenuItem(newWindowMenuItem));

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
    submenu: [newWindowMenuItem],
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

  const devOnlyMenuItems = [
    { role: 'reload' },
    { role: 'forceReload' },
    { role: 'toggleDevTools' },
    { type: 'separator' },
  ];

  // View Menu
  template.push({
    label: 'View',
    submenu: [
      ...(!isProduction ? devOnlyMenuItems : []),
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
