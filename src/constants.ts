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
export const isLoadingLocalReplit = baseUrl.includes('localhost');
export const isLoadingStagingReplit = baseUrl.includes('staging');
export const isLoadingProdReplit = baseUrl === defaultBaseUrl;

// Generated using path-to-regexp, the same package express uses to parse routes.
// See: https://github.com/pillarjs/path-to-regexp
// Matches /@:username/:slug
export const personalReplUrlRegex = /^\/@([^/#?]+?)(?:\/([^/#?]+?))[/#?]?$/i;
// Matches /t/:orgSlug/:orgId/repls/:replSlug
export const teamReplUrlRegex =
  /^\/t(?:\/([^/#?]+?))(?:\/([^/#?]+?))\/repls(?:\/([^/#?]+?))[/#?]?$/i;

export const homePage = '/desktopApp/home';
export const authPage = '/desktopApp/auth';
export const desktopAppPrefix = '/desktopApp';

// from https://stackoverflow.com/a/72900791/
export const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;

// https://www.electronjs.org/docs/latest/api/app#appispackaged-readonly
export const isProduction = app.isPackaged;
