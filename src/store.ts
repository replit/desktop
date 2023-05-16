import { Rectangle, screen } from "electron";
import Store from "electron-store";

const keys = {
  LAST_SEEN_BACKGROUND_COLOR: "LAST_SEEN_BACKGROUND_COLOR",
  SPLASH_SCREEN_WINDOW_BOUNDS: "SPLASH_SCREEN_WINDOW_BOUNDS",
  FULL_WINDOW_BOUNDS: "FULL_WINDOW_BOUNDS",
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
    setFullWindowBounds(bounds: Rectangle) {
      store.set(keys.FULL_WINDOW_BOUNDS, bounds);
    },
    getFullWindowBounds(): Rectangle {
      // We're assuming that the active screen is the one with the mouse cursor.
      // This fixes the bug where opening a Repl from a Splash Screen opens it on some other display.
      const mousePosition = screen.getCursorScreenPoint();
      const mouseScreen = screen.getDisplayNearestPoint(mousePosition);

      return store.get(
        keys.FULL_WINDOW_BOUNDS,
        mouseScreen.workArea
      ) as Rectangle;
    },
    setSplashScreenWindowBounds(bounds: Rectangle) {
      store.set(keys.SPLASH_SCREEN_WINDOW_BOUNDS, bounds);
    },
    getSplashScreenWindowBounds(): Rectangle {
      const { workArea } = screen.getPrimaryDisplay();
      const width = 480;
      const height = 640;

      const defaultBounds = {
        x: Math.round(workArea.width / 2 - width / 2),
        y: Math.round(workArea.height / 2 - height / 2),
        width,
        height,
      };

      return store.get(
        keys.SPLASH_SCREEN_WINDOW_BOUNDS,
        defaultBounds
      ) as Rectangle;
    },
  };
}

export default createStore();
