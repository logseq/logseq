// This file is used to store basic functions that are used in other utils
// Should have no dependency on other utils

import * as process from 'process'

export const IsMac = process.platform === 'darwin'
export const IsLinux = process.platform === 'linux'
export const IsWindows = process.platform === 'win32'
export const IsCI = process.env.CI === 'true'
// Set the modifier key to be used for keyboard shortcuts (e.g. Ctrl or Cmd)
export const modKey = IsMac ? 'Meta' : 'Control'
// Default delay in milliseconds for keypress delay
export const KEYPRESS_DELAY = 10;
// Default delay in milliseconds for text input or writing
export const TXT_INPUT_DELAY = 20;
// Default delay in milliseconds for auto-save to trigger
export const AUTO_SAVE_DELAY = 500;
// Selector for text input
export const TXT_AREA_SELECTOR = 'textarea >> nth=0'
// Selector for page search modal (opened with [[]] or #)
export const PAGE_SEARCH_MODAL = '[data-modal-name="page-search"]';
// Selector for dialogue text input modal
export const INPUT_MODAL = '[data-modal-name="input"]';
// Selector for slash commands menu modal
export const COMMANDS_MODAL = '[data-modal-name="commands"]';

export function randomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function randomLowerString(length: number) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomBoolean(): boolean {
  return Math.random() < 0.5;
}
