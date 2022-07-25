import { LETTER_SPACING } from './constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let melm: any

function getMeasurementDiv() {
  // A div used for measurement
  document.getElementById('__textLabelMeasure')?.remove()

  const pre = document.createElement('pre')
  pre.id = '__textLabelMeasure'

  Object.assign(pre.style, {
    whiteSpace: 'pre',
    width: 'auto',
    border: '1px solid transparent',
    padding: '4px',
    margin: '0px',
    letterSpacing: LETTER_SPACING,
    opacity: '0',
    position: 'absolute',
    top: '-500px',
    left: '0px',
    zIndex: '9999',
    pointerEvents: 'none',
    userSelect: 'none',
    alignmentBaseline: 'mathematical',
    dominantBaseline: 'mathematical',
  })

  pre.tabIndex = -1

  document.body.appendChild(pre)
  return pre
}

if (typeof window !== 'undefined') {
  melm = getMeasurementDiv()
}

const cache = new Map<string, [number, number]>()
const getKey = (text: string, font: string) => {
  return `${text}-${font}`
}
const hasCached = (text: string, font: string) => {
  const key = getKey(text, font)
  return cache.has(key)
}
const getCached = (text: string, font: string) => {
  const key = getKey(text, font)
  return cache.get(key)
}
const saveCached = (text: string, font: string, size: [number, number]) => {
  const key = getKey(text, font)
  cache.set(key, size)
}

export function getTextLabelSize(text: string, font: string) {
  if (!text) {
    return [16, 32]
  }

  if (!hasCached(text, font)) {
    if (!melm) {
      // We're in SSR
      return [10, 10]
    }

    if (!melm.parent) document.body.appendChild(melm)

    melm.textContent = text
    melm.style.font = font

    // In tests, offsetWidth and offsetHeight will be 0
    const width = melm.offsetWidth || 1
    const height = melm.offsetHeight || 1

    saveCached(text, font, [width, height])
  }

  return getCached(text, font)!
}
