import * as Sentry from "@sentry/electron";
import { isProduction } from "./constants";

// DSN for "desktop" project in Sentry
const dsn =
  "https://d88a656213ca4c1892091cc955fd7783@o1151714.ingest.sentry.io/4505167464693760";

export function initSentry(): void {
  if (!isProduction) {
    return;
  }

  Sentry.init({
    dsn,
  });
}
