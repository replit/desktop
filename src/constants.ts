import { nativeImage } from "electron";
import * as path from "path";

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
