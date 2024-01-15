import { Color } from '../types'

export function isBuiltInColor(color: string | undefined): boolean {
  return Object.values(Color).includes(color as Color)
}

export function getComputedColor(color: string | undefined, type: string): string {
  if (isBuiltInColor(color) || color == null) {
    return `var(--ls-wb-${type}-color-${color ? color : 'default'})`
  }

  return color
}
