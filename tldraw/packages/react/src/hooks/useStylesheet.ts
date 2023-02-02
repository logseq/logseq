import * as React from 'react'
import { BINDING_DISTANCE, TLTheme } from '@tldraw/core'

const styles = new Map<string, HTMLStyleElement>()

type AnyTheme = Record<string, string>

function makeCssTheme<T = AnyTheme>(prefix: string, theme: T) {
  return Object.keys(theme).reduce((acc, key) => {
    const value = theme[key as keyof T]
    if (value) {
      return acc + `${`--${prefix}-${key}`}: ${value};\n`
    }
    return acc
  }, '')
}

function useTheme<T = AnyTheme>(prefix: string, theme: T, selector = '.logseq-tldraw') {
  React.useLayoutEffect(() => {
    const style = document.createElement('style')
    const cssTheme = makeCssTheme(prefix, theme)

    style.setAttribute('id', `${prefix}-theme`)
    style.setAttribute('data-selector', selector)
    style.innerHTML = `
        ${selector} {
          ${cssTheme}
        }
      `

    document.head.appendChild(style)

    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [prefix, theme, selector])
}

function useStyle(uid: string, rules: string) {
  React.useLayoutEffect(() => {
    if (styles.get(uid)) {
      return () => void null
    }

    const style = document.createElement('style')
    style.innerHTML = rules
    style.setAttribute('id', uid)
    document.head.appendChild(style)
    styles.set(uid, style)

    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style)
        styles.delete(uid)
      }
    }
  }, [uid, rules])
}

const css = (strings: TemplateStringsArray, ...args: unknown[]) =>
  strings.reduce(
    (acc, string, index) => acc + string + (index < args.length ? args[index] : ''),
    ''
  )

const defaultTheme: TLTheme = {
  accent: 'rgb(255, 0, 0)',
  brushFill: 'var(--ls-scrollbar-background-color, rgba(0, 0, 0, .05))',
  brushStroke: 'var(--ls-scrollbar-thumb-hover-color, rgba(0, 0, 0, .05))',
  selectStroke: 'var(--color-selectedFill)',
  selectFill: 'rgba(65, 132, 244, 0.05)',
  binding: 'rgba(65, 132, 244, 0.5)',
  background: 'var(--ls-primary-background-color)',
  foreground: 'var(--ls-primary-text-color)',
  grid: 'var(--ls-quaternary-background-color)',
}

const tlcss = css`
  .tl-container {
    --tl-zoom: 1;
    --tl-scale: calc(1 / var(--tl-zoom));
    --tl-padding: 64px;
    --tl-shadow-color: 0deg 0% 0%;
    --tl-binding-distance: ${BINDING_DISTANCE}px;
    --tl-shadow-elevation-low: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0px 0.6px 0.8px -0.7px hsl(var(--tl-shadow-color) / 0.06),
      0.1px 1.2px 1.5px -1.4px hsl(var(--tl-shadow-color) / 0.08);
    --tl-shadow-elevation-medium: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0.1px 1.3px 1.7px -0.5px hsl(var(--tl-shadow-color) / 0.06),
      0.1px 2.8px 3.6px -1px hsl(var(--tl-shadow-color) / 0.07),
      0.3px 6.1px 7.8px -1.4px hsl(var(--tl-shadow-color) / 0.09);
    --tl-shadow-elevation-high: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0.1px 2.3px 3px -0.2px hsl(var(--tl-shadow-color) / 0.05),
      0.2px 4.1px 5.3px -0.5px hsl(var(--tl-shadow-color) / 0.06),
      0.4px 6.6px 8.5px -0.7px hsl(var(--tl-shadow-color) / 0.07),
      0.6px 10.3px 13.2px -1px hsl(var(--tl-shadow-color) / 0.08),
      0.9px 16px 20.6px -1.2px hsl(var(--tl-shadow-color) / 0.09),
      1.3px 24.3px 31.2px -1.4px hsl(var(--tl-shadow-color) / 0.1);
    box-sizing: border-box;
    position: relative;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
    padding: 0px;
    margin: 0px;
    outline: none;
    z-index: 100;
    user-select: none;
    touch-action: none;
    overscroll-behavior: none;
    background-color: var(--tl-background);
    cursor: inherit;
    box-sizing: border-box;
    color: var(--tl-foreground);
    -webkit-user-select: none;
    -webkit-user-drag: none;
  }

  .tl-overlay {
    background: none;
    fill: transparent;
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
  }

  .tl-snap-line {
    stroke: var(--tl-accent);
    stroke-width: calc(1px * var(--tl-scale));
  }

  .tl-snap-point {
    stroke: var(--tl-accent);
    stroke-width: calc(1px * var(--tl-scale));
  }

  .tl-canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: all;
    overflow: clip;
    outline: none;
  }

  .tl-layer {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 0px;
    width: 0px;
    contain: layout style size;
  }

  .tl-absolute {
    position: absolute;
    top: 0px;
    left: 0px;
    transform-origin: center center;
    contain: layout style size;
  }

  .tl-positioned {
    position: absolute;
    transform-origin: center center;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    contain: layout style size;
  }

  .tl-positioned-svg {
    width: 100%;
    height: 100%;
    overflow: hidden;
    contain: layout style size;
    pointer-events: none;
  }

  .tl-positioned-div {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--tl-padding);
    contain: layout style size;
  }

  .tl-positioned-inner {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .tl-counter-scaled {
    transform: scale(var(--tl-scale));
  }

  .tl-dashed {
    stroke-dasharray: calc(2px * var(--tl-scale)), calc(2px * var(--tl-scale));
  }

  .tl-transparent {
    fill: transparent;
    stroke: transparent;
  }

  .tl-corner-handle {
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-rotate-handle {
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-user {
    left: -4px;
    top: -4px;
    height: 8px;
    width: 8px;
    border-radius: 100%;
    pointer-events: none;
  }

  .tl-indicator {
    fill: transparent;
    stroke-width: calc(1.5px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-indicator-container {
    transform-origin: 0 0;
    fill: transparent;
    stroke-width: calc(1.5px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-user-indicator-bounds {
    border-style: solid;
    border-width: calc(1px * var(--tl-scale));
  }

  .tl-selected {
    stroke: var(--tl-selectStroke);
  }

  .tl-hovered {
    stroke: var(--tl-selectStroke);
  }

  .tl-clone-target {
    pointer-events: all;
  }

  .tl-clone-target:hover .tl-clone-button {
    opacity: 1;
  }

  .tl-clone-button-target {
    cursor: pointer;
    pointer-events: all;
  }

  .tl-clone-button-target:hover .tl-clone-button {
    fill: var(--tl-selectStroke);
  }

  .tl-clone-button {
    opacity: 0;
    r: calc(8px * var(--tl-scale));
    stroke-width: calc(1.5px * var(--tl-scale));
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
  }

  .tl-bounds {
    pointer-events: none;
    contain: layout style size;
  }

  .tl-bounds-bg {
    stroke: none;
    fill: var(--tl-selectFill);
    pointer-events: all;
    contain: layout style size;
  }

  .tl-bounds-fg {
    fill: transparent;
    stroke: var(--tl-selectStroke);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-brush {
    fill: var(--tl-brushFill);
    stroke: var(--tl-brushStroke);
    stroke-width: calc(1px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-dot {
    fill: var(--tl-background);
    stroke: var(--tl-foreground);
    stroke-width: 2px;
  }

  .tl-handle {
    fill: var(--tl-background);
    stroke: var(--tl-selectStroke);
    stroke-width: 1.5px;
    pointer-events: none;
  }

  .tl-handle-bg {
    fill: transparent;
    stroke: none;
    r: calc(16px / max(1, var(--tl-zoom)));
    pointer-events: all;
    cursor: grab;
  }

  .tl-handle-bg:active {
    pointer-events: all;
    fill: none;
  }

  .tl-handle-bg:hover {
    cursor: grab;
    fill: var(--tl-selectFill);
  }

  .tl-binding-indicator {
    fill: transparent;
    stroke: var(--tl-binding);
  }

  .tl-centered {
    display: grid;
    place-content: center;
    place-items: center;
  }

  .tl-centered > * {
    grid-column: 1;
    grid-row: 1;
  }

  .tl-centered-g {
    transform: translate(var(--tl-padding), var(--tl-padding));
  }

  .tl-current-parent > *[data-shy='true'] {
    opacity: 1;
  }

  .tl-binding {
    fill: none;
    stroke: var(--tl-selectStroke);
    stroke-width: calc(2px * var(--tl-scale));
  }

  .tl-counter-scaled-positioned {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    padding: 0;
    contain: layout style size;
  }

  .tl-fade-in {
    opacity: 1;
    transition-timing-function: ease-in-out;
    transition-property: opacity;
    transition-duration: 0.12s;
    transition-delay: 0;
  }

  .tl-fade-out {
    opacity: 0;
    transition-timing-function: ease-out;
    transition-property: opacity;
    transition-duration: 0.12s;
    transition-delay: 0;
  }

  .tl-counter-scaled-positioned > .tl-positioned-div {
    user-select: none;
    padding: 64px;
  }

  .tl-context-bar > * {
    grid-column: 1;
    grid-row: 1;
  }

  .tl-bounds-detail {
    padding: 2px 3px;
    border-radius: 1px;
    white-space: nowrap;
    width: fit-content;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    background-color: var(--tl-selectStroke);
    color: var(--tl-background);
  }

  .tl-grid-canvas {
    position: absolute;
    touch-action: none;
    pointer-events: none;
    user-select: none;
  }

  .tl-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
    user-select: none;
  }

  .tl-grid-dot {
    fill: var(--tl-grid);
  }

  .tl-html-canvas {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    zindex: 20000;
    pointer-events: none;
    border: 2px solid red;
  }

  .tl-direction-indicator {
    z-index: 100000;
    position: absolute;
    top: 0px;
    left: 0px;
    fill: var(--tl-selectStroke);
  }
`

export function useStylesheet(theme?: Partial<TLTheme>, selector?: string) {
  const tltheme = React.useMemo<TLTheme>(
    () => ({
      ...defaultTheme,
      ...theme,
    }),
    [theme]
  )

  useTheme('tl', tltheme, selector)
  useStyle('tl-canvas', tlcss)
}
