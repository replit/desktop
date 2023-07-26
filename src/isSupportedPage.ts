import { desktopAppPrefix, workspaceUrlRegex } from "./constants";

const supportedNonDesktopAppPages = ["logout"];

export default function isSupportedPage(page: string): boolean {
  return (
    page.startsWith(desktopAppPrefix) ||
    workspaceUrlRegex.test(page) ||
    supportedNonDesktopAppPages.includes(page)
  );
}
