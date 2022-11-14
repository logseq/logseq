import { Color } from '../types'

export function getComputedColor(color: string, type: string): string {
  if (Object.values(Color).includes(color)) {
    return `var(--ls-wb-${type}-color-${color ? color : 'default'})`
  }

  return color
}
