import * as Sentry from '@sentry/electron';
import { isProduction } from './constants';
import log from 'electron-log/main';
import store from './store';
import type { User } from './types';

// DSN for "desktop" project in Sentry
const dsn =
  'https://d88a656213ca4c1892091cc955fd7783@o1151714.ingest.sentry.io/4505167464693760';

export function initSentry(): void {
  if (!isProduction) {
    return;
  }

  log.info('Initializing Sentry');

  Sentry.init({
    dsn,
  });

  setUser(store.getUser());
}

export function setUser(user: User | null) {
  if (!isProduction) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);

    return;
  }

  const { id, username, email } = user;
  Sentry.setUser({
    id: id.toString(),
    email,
    username,
  });
}
