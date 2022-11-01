import { Color } from '@tldraw/core'

let melm: any

function getMeasurementDiv() {
  // A div used for measurement
  document.getElementById('__colorMeasure')?.remove()

  const div = document.createElement('div')
  div.id = '__colorMeasure'
  div.tabIndex = -1

  document.body.appendChild(div)
  return div
}

export function getComputedColor(color: string, type: string): string {
  if (Object.values(Color).includes(color)) {
    return `var(--ls-wb-${type}-color-${color ? color : 'default'})`
  }

  return color
}
