import { uniqueId } from '@tldraw/core'

export interface TLTextMeasureStyles {
  fontStyle?: string
  fontVariant?: string
  fontWeight?: number
  fontSize: number
  fontFamily: string
  lineHeight: number
}

export class TLTextMeasure {
  private elm: HTMLPreElement

  constructor() {
    const pre = document.createElement('pre')
    const id = uniqueId()

    pre.id = `__textMeasure_${id}`

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
    })

    pre.tabIndex = -1
    document.body.appendChild(pre)
    this.elm = pre
  }

  measureText = (text: string, styles: TLTextMeasureStyles, padding = 0) => {
    const { elm } = this

    elm.style.setProperty(
      'font',
      `${styles.fontStyle ?? 'normal'} ${styles.fontVariant ?? 'normal'} ${
        styles.fontWeight ?? 'normal'
      } ${styles.fontSize}px/${styles.fontSize * styles.lineHeight}px ${styles.fontFamily}`
    )
    elm.style.padding = padding + 'px'
    elm.innerHTML = `${text}&#8203;`

    const width = elm.offsetWidth ?? 1
    const height = elm.offsetHeight ?? 1

    return {
      width,
      height,
    }
  }
}
