import { isPlainObject } from 'is-plain-object'
import copy from 'fast-copy'
export { default as deepEqual } from 'fast-deep-equal'
import deepmerge from 'deepmerge'

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Deep copy function for TypeScript.
 *
 * @param T Generic type of target/copied value.
 * @param target Target value to be copied.
 * @see Source project, ts-deeply https://github.com/ykdr2017/ts-deepcopy
 * @see Code pen https://codepen.io/erikvullings/pen/ejyBYg
 */
export const deepCopy = copy

type Patch<T> = Partial<{ [P in keyof T]: T | Partial<T> | Patch<T[P]> }>

export function deepMerge<T>(a: T, b: Patch<T>): T {
  // @ts-expect-error ???
  return deepmerge(a, b, {
    arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
  })
}

/**
 * Modulate a value between two ranges.
 *
 * @param value
 * @param rangeA From [low, high]
 * @param rangeB To [low, high]
 * @param clamp
 */
export function modulate(value: number, rangeA: number[], rangeB: number[], clamp = false): number {
  const [fromLow, fromHigh] = rangeA
  const [v0, v1] = rangeB
  const result = v0 + ((value - fromLow) / (fromHigh - fromLow)) * (v1 - v0)

  return clamp
    ? v0 < v1
      ? Math.max(Math.min(result, v1), v0)
      : Math.max(Math.min(result, v0), v1)
    : result
}

/**
 * Clamp a value into a range.
 *
 * @param n
 * @param min
 */
export function clamp(n: number, min: number): number
export function clamp(n: number, min: number, max: number): number
export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, typeof max !== 'undefined' ? Math.min(n, max) : n)
}

const serializableTypes = new Set(['string', 'number', 'boolean', 'undefined'])

export function isSerializable(value: any): boolean {
  if (serializableTypes.has(typeof value) || value === null) return true
  if (Array.isArray(value)) return value.every(isSerializable)
  if (isPlainObject(value)) return Object.values(value).every(isSerializable)
  return false
}

export function fileToBase64(file: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
      reader.onabort = error => reject(error)
    }
  })
}

export function getSizeFromSrc(dataURL: string, type: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    if (type === 'video') {
      const video = document.createElement('video')

      // place a listener on it
      video.addEventListener(
        'loadedmetadata',
        function () {
          // retrieve dimensions
          const height = this.videoHeight
          const width = this.videoWidth

          // send back result
          resolve([width, height])
        },
        false
      )
      // start download meta-datas
      video.src = dataURL
    } else if (type === 'image') {
      const img = new Image()
      img.onload = () => resolve([img.width, img.height])
      img.src = dataURL
      img.onerror = err => reject(err)
    } else if (type === 'pdf') {
      resolve([595, 842]) // A4 portrait dimensions at 72 ppi
    }
  })
}

export function getFirstFromSet<T = unknown>(set: Set<T>): T {
  return set.values().next().value
}

/**
 * Seeded random number generator, using [xorshift](https://en.wikipedia.org/wiki/Xorshift). The
 * result will always be between -1 and 1.
 *
 * Adapted from [seedrandom](https://github.com/davidbau/seedrandom).
 */
export function rng(seed = ''): () => number {
  let x = 0
  let y = 0
  let z = 0
  let w = 0

  function next() {
    const t = x ^ (x << 11)
    x = y
    y = z
    z = w
    w ^= ((w >>> 19) ^ t ^ (t >>> 8)) >>> 0
    return w / 0x100000000
  }

  for (let k = 0; k < seed.length + 64; k++) {
    x ^= seed.charCodeAt(k) | 0
    next()
  }

  return next
}
