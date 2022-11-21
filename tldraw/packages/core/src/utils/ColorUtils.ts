import { Color } from '../types'

export function getComputedColor(color: string, type: string): string {
  if (Object.values(Color).includes(color as Color) || color == null) {
    return `var(--ls-wb-${type}-color-${color ? color : 'default'})`
  }

  return color
}
