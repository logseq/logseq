// This file is used to store basic functions that are used in other utils
// Should have no dependency on other utils

import * as process from 'process'

export const IsMac = process.platform === 'darwin'
export const IsLinux = process.platform === 'linux'
export const IsWindows = process.platform === 'win32'
export const IsCI = process.env.CI === 'true'
export const modKey = IsMac ? 'Meta' : 'Control'

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
