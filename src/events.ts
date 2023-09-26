/**
 * Events that correspond to the protocol we use when communicating
 * with the renderer process via IPC.
 *
 * Note that we can't use `import` in this file,
 * as that will break `./preload.ts` since we bundle only local files.
 */
export enum events {
  CLOSE_CURRENT_WINDOW = 'CLOSE_CURRENT_WINDOW',
  AUTH_TOKEN_RECEIVED = 'AUTH_TOKEN_RECEIVED',
  OPEN_WINDOW = 'OPEN_WINDOW',
  OPEN_EXTERNAL_URL = 'OPEN_EXTERNAL_URL',
  LOGOUT = 'LOGOUT',
  SHOW_MESSAGE_BOX = 'SHOW_MESSAGE_BOX',
  CHECK_FOR_UPDATES = 'CHECK_FOR_UPDATES',
  ON_FULLSCREEN_CHANGED = 'ON_FULLSCREEN_CHANGED',
  ON_FOCUSED_CHANGED = 'ON_FOCUSED_CHANGED',
  THEME_VALUES_CHANGED = 'THEME_VALUES_CHANGED',
  UPDATE_USER_INFO = 'UPDATE_USER_INFO',
  GET_USER_INFO = 'GET_USER_INFO',
}
