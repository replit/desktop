import { Rectangle } from "electron";
import ElectronStore from "electron-store";

const KEYS = {
  LAST_SEEN_BACKGROUND_COLOR: "LAST_SEEN_BACKGROUND_COLOR",
  BOUNDS: "BOUNDS",
};

class Store {
  #store = new ElectronStore();

  public setLastSeenBackgroundColor(color: string) {
    this.#store.set(KEYS.LAST_SEEN_BACKGROUND_COLOR, color);
  }

  public getLastSeenBackgroundColor() {
    return this.#store.get(KEYS.LAST_SEEN_BACKGROUND_COLOR);
  }

  public setBounds(bounds: Rectangle) {
    this.#store.set(KEYS.BOUNDS, bounds);
  }

  public getBounds() {
    return this.#store.get(KEYS.BOUNDS);
  }
}

const store = new Store();

export default store;
