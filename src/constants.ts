import { nativeImage } from "electron";
import * as path from "path";

/**
 * Events that correspond to the protocol we use when communicating
 * with the renderer process via IPC.
 *
 * Note this must match the events enum declared in `preload.ts`.
 * Code cannot be shared between the two since they exist in
 * different contexts when `nodeIntegration` is turned off so
 * we must maintain seperate copies.
 */
export enum events {
  CLOSE_CURRENT_WINDOW = "CLOSE_CURRENT_WINDOW",
  OPEN_REPL_WINDOW = "OPEN_REPL_WINDOW",
  LOGOUT = "LOGOUT",
}

export const appName = "Replit";
export const protocol = "replit";

export const appIcon = nativeImage.createFromPath(
  path.join(__dirname, "assets", "logo.png")
);

export const macAppIcon = nativeImage.createFromPath(
  path.join(__dirname, "assets", "logo-mac.png")
);

export const preloadScript = path.join(__dirname, "preload.js");

export const baseUrl = process.env.USE_LOCAL_URL
  ? `http://localhost:3000`
  : `https://replit.com`;
