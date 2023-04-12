import { Menu, MenuItem } from "electron";
import createWindow from "./createWindow";

export default function createMenu(): void {
  const menu = new Menu();
  menu.append(
    new MenuItem({
      label: "Replit",
      submenu: [
        {
          label: "Create new window",
          accelerator: "CommandOrControl+Shift+N",
          click: () => createWindow(),
        },
      ],
    })
  );

  Menu.setApplicationMenu(menu);
}
