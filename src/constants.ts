import { app, nativeImage } from "electron";
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
  AUTH_TOKEN_RECEIVED = "AUTH_TOKEN_RECEIVED",
  OPEN_REPL_WINDOW = "OPEN_REPL_WINDOW",
  OPEN_SPLASH_SCREEN_WINDOW = "OPEN_SPLASH_SCREEN_WINDOW",
  OPEN_EXTERNAL_URL = "OPEN_EXTERNAL_URL",
  LOGOUT = "LOGOUT",
  ON_ENTER_FULLSCREEN = "ON_ENTER_FULLSCREEN",
  ON_LEAVE_FULLSCREEN = "ON_LEAVE_FULLSCREEN",
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

export const baseUrl = process.env.REPLIT_URL || "https://replit.com";

// https://www.electronjs.org/docs/latest/api/app#appispackaged-readonly
export const isProduction = app.isPackaged;
