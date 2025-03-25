import { Rectangle, screen } from 'electron';
import Store from 'electron-store';
import {
  isProduction,
  isLoadingLocalReplit,
  isLoadingStagingReplit,
  isLoadingProdReplit,
  baseUrl,
} from './constants';
import type { User } from './types';

enum Key {
  LAST_SEEN_BACKGROUND_COLOR = 'LAST_SEEN_BACKGROUND_COLOR',
  LAST_SEEN_FOREGROUND_COLOR = 'LAST_SEEN_FOREGROUND_COLOR',
  LAST_OPEN_REPL = 'LAST_OPEN_REPL',
  WINDOW_BOUNDS = 'WINDOW_BOUNDS',
  NUM_DISPLAYS = 'NUM_DISPLAYS',
  USER_INFO = 'USER_INFO',
}

// Default values for var(--background-root) and var(--foreground-default) in dark mode.
const defaultBgColor = '#0E1525';
const defaultFgColor = '#F5F9FC';

// Different store in the different dev modes and in production
function getStoreName() {
  if (isProduction) {
    return 'config';
  }

  if (isLoadingProdReplit) {
    return 'config-dev';
  }

  if (isLoadingLocalReplit) {
    return 'config-dev-local';
  }

  if (isLoadingStagingReplit) {
    return 'config-dev-staging';
  }

  // Other URLs could be repl.co URLs from hosted RoR instances
  const { host } = new URL(baseUrl);

  return `config-dev-${host}`;
}

function createStore() {
  const name = getStoreName();
  const store = new Store({
    name,
  });

  return {
    setLastSeenBackgroundColor(color: string) {
      store.set(Key.LAST_SEEN_BACKGROUND_COLOR, color);
    },
    getLastSeenBackgroundColor(): string {
      return store.get(
        Key.LAST_SEEN_BACKGROUND_COLOR,
        defaultBgColor,
      ) as string;
    },
    setLastSeenForegroundColor(color: string) {
      store.set(Key.LAST_SEEN_FOREGROUND_COLOR, color);
    },
    getLastSeenForegroundColor(): string {
      return store.get(
        Key.LAST_SEEN_FOREGROUND_COLOR,
        defaultFgColor,
      ) as string;
    },
    clearWindowBounds() {
      store.delete(Key.WINDOW_BOUNDS);
    },
    setWindowBounds(bounds: Rectangle) {
      store.set(Key.WINDOW_BOUNDS, bounds);
    },
    getWindowBounds(): Rectangle {
      // We're assuming that the active screen is the one with the mouse cursor.
      // This fixes the bug where opening a Repl from a Splash Screen opens it on some other display.
      const mousePosition = screen.getCursorScreenPoint();
      const mouseScreen = screen.getDisplayNearestPoint(mousePosition);
      const workArea = mouseScreen.workArea;

      const DEFAULT_WIDTH = 1200;
      const DEFAULT_HEIGHT = 900;
      const PADDING = 40;

      let defaultBounds: Rectangle;
      if (
        DEFAULT_WIDTH <= workArea.width &&
        DEFAULT_HEIGHT <= workArea.height
      ) {
        // If the window fits, center it in the work area
        const x = workArea.x + Math.floor((workArea.width - DEFAULT_WIDTH) / 2);
        const y =
          workArea.y + Math.floor((workArea.height - DEFAULT_HEIGHT) / 2);
        defaultBounds = { x, y, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
      } else {
        // If the default size is larger than the work area, shrink it
        defaultBounds = {
          x: workArea.x + PADDING,
          y: workArea.y + PADDING,
          width: workArea.width - PADDING * 2,
          height: workArea.height - PADDING * 2,
        };
      }

      return store.get(Key.WINDOW_BOUNDS, defaultBounds) as Rectangle;
    },
    getUser(): User | null {
      return store.get(Key.USER_INFO, null) as User | null;
    },
    setUser(user: User | null) {
      store.set(Key.USER_INFO, user);
    },
    setLastOpenRepl(path: string | null) {
      store.set(Key.LAST_OPEN_REPL, path);
    },
    getLastOpenRepl(): string | null {
      return store.get(Key.LAST_OPEN_REPL, null) as string | null;
    },
    onLastOpenReplChange(
      listener: (lastOpenRepl: string | null) => void,
    ): () => void {
      return store.onDidChange(Key.LAST_OPEN_REPL, listener);
    },
  };
}

export default createStore();
