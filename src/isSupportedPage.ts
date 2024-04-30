import {
  desktopAppPrefix,
  personalReplUrlRegex,
  teamReplUrlRegex,
} from './constants';

const supportedNonDesktopAppPages = ['logout'];

export default function isSupportedPage(page: string): boolean {
  return (
    page.startsWith(desktopAppPrefix) ||
    personalReplUrlRegex.test(page) ||
    teamReplUrlRegex.test(page) ||
    supportedNonDesktopAppPages.includes(page)
  );
}
