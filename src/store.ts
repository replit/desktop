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
    getLastSeenBackgroundColor() {
      return store.get(keys.LAST_SEEN_BACKGROUND_COLOR);
    },
    setBounds(bounds: Rectangle) {
      store.set(keys.BOUNDS, bounds);
    },
    getBounds() {
      return store.get(keys.BOUNDS);
    },
  };
}

export default createStore();
