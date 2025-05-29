import type { TLOffset } from '@tldraw/core'
export * from './types'
export * from './lib'
export * from './hooks'
export * from './components/HTMLContainer'
export * from './components/SVGContainer'
export * from './components/App'
export * from './components/AppProvider'
export * from './components/AppCanvas'
export { useMinimapEvents } from './hooks/useMinimapEvents'

export function getContextBarTranslation(barSize: number[], offset: TLOffset) {
  let x = 0
  let y = 0
  if (offset.top < 116) {
    // Show on bottom
    y = offset.height / 2 + 40
    // Too far down, move up
    if (offset.bottom < 140) {
      y += offset.bottom - 140
    }
  } else {
    // Show on top
    y = -(offset.height / 2 + 40)
  }
  // Too far right, move left
  if (offset.left + offset.width / 2 - barSize[0] / 2 < 16) {
    x += -(offset.left + offset.width / 2 - barSize[0] / 2 - 16)
  } else if (offset.right + offset.width / 2 - barSize[0] / 2 < 16) {
    x += offset.right + offset.width / 2 - barSize[0] / 2 - 16
  }
  return [x, y]
}
