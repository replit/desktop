import { Rectangle, screen } from 'electron';
import Store from 'electron-store';

const keys = {
  LAST_SEEN_BACKGROUND_COLOR: 'LAST_SEEN_BACKGROUND_COLOR',
  LAST_SEEN_FOREGROUND_COLOR: 'LAST_SEEN_FOREGROUND_COLOR',
  LAST_OPEN_REPL: 'LAST_OPEN_REPL',
  WINDOW_BOUNDS: 'WINDOW_BOUNDS',
  NUM_DISPLAYS: 'NUM_DISPLAYS',
};

// Default values for var(--background-root) and var(--foreground-default) in dark mode.
const defaultBgColor = '#0E1525';
const defaultFgColor = '#F5F9FC';

function createStore() {
  const store = new Store();

  return {
    setLastSeenBackgroundColor(color: string) {
      store.set(keys.LAST_SEEN_BACKGROUND_COLOR, color);
    },
    getLastSeenBackgroundColor(): string {
      return store.get(
        keys.LAST_SEEN_BACKGROUND_COLOR,
        defaultBgColor,
      ) as string;
    },
    setLastSeenForegroundColor(color: string) {
      store.set(keys.LAST_SEEN_FOREGROUND_COLOR, color);
    },
    getLastSeenForegroundColor(): string {
      return store.get(
        keys.LAST_SEEN_FOREGROUND_COLOR,
        defaultFgColor,
      ) as string;
    },
    clearWindowBounds() {
      store.delete(keys.WINDOW_BOUNDS);
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
    onLastOpenReplChange(
      listener: (lastOpenRepl: string | null) => void,
    ): () => void {
      return store.onDidChange(keys.LAST_OPEN_REPL, listener);
    },
  };
}

export default createStore();
