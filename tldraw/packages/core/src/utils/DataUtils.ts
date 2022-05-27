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

export function getSizeFromSrc(dataURL: string): Promise<number[]> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve([img.width, img.height])
    img.src = dataURL
  })
}

export function getFirstFromSet<T = unknown>(set: Set<T>): T {
  return set.values().next().value
}
