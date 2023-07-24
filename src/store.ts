import { Rectangle, screen } from "electron";
import Store from "electron-store";

const keys = {
  LAST_SEEN_BACKGROUND_COLOR: "LAST_SEEN_BACKGROUND_COLOR",
  LAST_OPEN_REPL: "LAST_OPEN_REPL",
  WINDOW_BOUNDS: "WINDOW_BOUNDS",
};

// var(--background-root) value for dark mode
const defaultBgColor = "#0E1525";

function createStore() {
  const store = new Store();

  return {
    setLastSeenBackgroundColor(color: string) {
      store.set(keys.LAST_SEEN_BACKGROUND_COLOR, color);
    },
    getLastSeenBackgroundColor(): string {
      return store.get(
        keys.LAST_SEEN_BACKGROUND_COLOR,
        defaultBgColor
      ) as string;
    },
    setWindowBounds(bounds: Rectangle) {
      store.set(keys.WINDOW_BOUNDS, bounds);
    },
    getWindowBounds(): Rectangle {
      // We're assuming that the active screen is the one with the mouse cursor.
      // This fixes the bug where opening a Repl from a Splash Screen opens it on some other display.
      const mousePosition = screen.getCursorScreenPoint();
      const mouseScreen = screen.getDisplayNearestPoint(mousePosition);

      return store.get(keys.WINDOW_BOUNDS, mouseScreen.workArea) as Rectangle;
    },
    setLastOpenRepl(path: string | null) {
      store.set(keys.LAST_OPEN_REPL, path);
    },
    getLastOpenRepl(): string | null {
      return store.get(keys.LAST_OPEN_REPL, null) as string | null;
    },
  };
}

export default createStore();
