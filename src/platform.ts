export function isMac(): boolean {
  return process.platform === "darwin";
}

export function isWindows(): boolean {
  return process.platform === "win32";
}

export function isLinux(): boolean {
  return !isMac() && !isWindows();
}
