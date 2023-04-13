import { clipboard, Menu, MenuItem } from "electron";
import createWindow from "./createWindow";

export default function createMenu(): Menu {
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
        {
          label: "Open Repl URL from Clipboard",
          click: () => {
            const clipboardText = clipboard.readText();

            if (clipboardText.startsWith("https://replit.com/@")) {
              createWindow(clipboardText);
            }
          },
        },
      ],
    })
  );

  return menu;
}
