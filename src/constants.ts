import { app, nativeImage } from 'electron';
import * as path from 'path';

export const appName = 'Replit';
export const protocol = 'replit';

export const appIcon = nativeImage.createFromPath(
  path.join(__dirname, 'assets', 'logo.png'),
);

export const macAppIcon = nativeImage.createFromPath(
  path.join(__dirname, 'assets', 'logo-mac.png'),
);

export const preloadScript = path.join(__dirname, 'preload.js');

const defaultBaseUrl = 'https://replit.com';
export const baseUrl = process.env.REPLIT_URL || defaultBaseUrl;
export const isLoadingLocalhost = baseUrl.includes('localhost');
export const isLoadingStaging = baseUrl.includes('staging');
export const isLoadingProd = baseUrl === defaultBaseUrl;

export const workspaceUrlRegex = /^\/@\S+\/\S+/;

export const homePage = '/desktopApp/home';
export const authPage = '/desktopApp/auth';
export const desktopAppPrefix = '/desktopApp';

// from https://stackoverflow.com/a/72900791/
export const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;

// https://www.electronjs.org/docs/latest/api/app#appispackaged-readonly
export const isProduction = app.isPackaged;
