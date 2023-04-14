import { Rectangle } from "electron";
import Store from "electron-store";

const keys = {
  LAST_SEEN_BACKGROUND_COLOR: "LAST_SEEN_BACKGROUND_COLOR",
  BOUNDS: "BOUNDS",
};

function createStore() {
  const store = new Store();

  return {
    setLastSeenBackgroundColor(color: string) {
      store.set(keys.LAST_SEEN_BACKGROUND_COLOR, color);
    },
    getLastSeenBackgroundColor(): string | null {
      const bgColor = store.get(keys.LAST_SEEN_BACKGROUND_COLOR);

      if (!bgColor) {
        return null;
      }

      return bgColor as string;
    },
    setBounds(bounds: Rectangle) {
      store.set(keys.BOUNDS, bounds);
    },
    getBounds(): Rectangle | null {
      const bounds = store.get(keys.BOUNDS);

      if (!bounds) {
        return null;
      }

      return bounds as Rectangle;
    },
  };
}

export default createStore();
