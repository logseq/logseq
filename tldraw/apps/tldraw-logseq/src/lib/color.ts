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

export function getComputedColor(color: string) {
  if (color?.toString().startsWith('var')) {
    const varName = /var\((.*)\)/.exec(color.toString())?.[1]
    if (varName) {
      const [v, d] = varName.split(',').map(s => s.trim())
      return getComputedStyle(getMeasurementDiv()).getPropertyValue(v).trim() ?? d ?? '#000'
    }
  }

  return color
}
