// eslint-disable-next-line @typescript-eslint/no-explicit-any
let melm: HTMLElement

interface TLTextMeasureStyles {
  fontStyle?: string
  fontVariant?: string
  fontWeight?: number
  fontSize: number
  fontFamily: string
  lineHeight: number
}

function getMeasurementDiv() {
  // A div used for measurement
  document.getElementById('__textLabelMeasure')?.remove()

  const pre = document.createElement('pre')
  pre.id = '__textLabelMeasure'

  Object.assign(pre.style, {
    whiteSpace: 'pre',
    width: 'auto',
    borderLeft: '2px solid transparent',
    borderRight: '1px solid transparent',
    borderBottom: '2px solid transparent',
    padding: '0px',
    margin: '0px',
    opacity: '0',
    position: 'absolute',
    top: '-500px',
    left: '0px',
    zIndex: '9999',
    userSelect: 'none',
    pointerEvents: 'none',
    font: 'var(--ls-font-family)',
  })

  pre.tabIndex = -1

  document.body.appendChild(pre)
  return pre
}

if (typeof window !== 'undefined') {
  melm = getMeasurementDiv()
}

const cache = new Map<string, [number, number]>()
const getKey = (text: string, font: string, padding: number) => {
  return `${text}-${font}-${padding}`
}
const hasCached = (text: string, font: string, padding: number) => {
  const key = getKey(text, font, padding)
  return cache.has(key)
}
const getCached = (text: string, font: string, padding: number) => {
  const key = getKey(text, font, padding)
  return cache.get(key)
}
const saveCached = (text: string, font: string, padding: number, size: [number, number]) => {
  const key = getKey(text, font, padding)
  cache.set(key, size)
}

export function getTextLabelSize(
  text: string,
  fontOrStyles: string | TLTextMeasureStyles,
  padding = 0
) {
  if (!text) {
    return [16, 32]
  }

  let font: string

  if (typeof fontOrStyles === 'string') {
    font = fontOrStyles
  } else {
    font = `${fontOrStyles.fontStyle ?? 'normal'} ${fontOrStyles.fontVariant ?? 'normal'} ${
      fontOrStyles.fontWeight ?? 'normal'
    } ${fontOrStyles.fontSize}px/${fontOrStyles.fontSize * fontOrStyles.lineHeight}px ${
      fontOrStyles.fontFamily
    }`
  }

  if (!hasCached(text, font, padding)) {
    if (!melm) {
      // We're in SSR
      return [10, 10]
    }

    if (!melm.parentNode) document.body.appendChild(melm)

    melm.innerHTML = `${text}&#8203;`
    melm.style.font = font
    melm.style.padding = padding + 'px'

    const rect = melm.getBoundingClientRect()

    // In tests, offsetWidth and offsetHeight will be 0
    const width = Math.ceil(rect.width || 1)
    const height = Math.ceil(rect.height || 1)

    saveCached(text, font, padding, [width, height])
  }

  return getCached(text, font, padding)!
}
