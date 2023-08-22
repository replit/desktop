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
  ON_ENTER_FULLSCREEN = 'ON_ENTER_FULLSCREEN',
  ON_LEAVE_FULLSCREEN = 'ON_LEAVE_FULLSCREEN',
}
