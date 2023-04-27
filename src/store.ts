import { Rectangle, screen } from "electron";
import Store from "electron-store";

const keys = {
  LAST_SEEN_BACKGROUND_COLOR: "LAST_SEEN_BACKGROUND_COLOR",
  BOUNDS: "BOUNDS",
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
    setBounds(bounds: Rectangle) {
      store.set(keys.BOUNDS, bounds);
    },
    getBounds(): Rectangle {
      return store.get(
        keys.BOUNDS,
        screen.getPrimaryDisplay().workArea
      ) as Rectangle;
    },
  };
}

export default createStore();
