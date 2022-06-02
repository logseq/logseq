/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import type { TLBounds } from '@tldraw/core'

export function useCounterScaledPosition(
  ref: React.RefObject<HTMLElement>,
  bounds: TLBounds,
  rotation: number,
  zIndex: number
) {
  React.useLayoutEffect(() => {
    const elm = ref.current!
    elm.style.transform = `translate(
        calc(${bounds.minX}px - var(--tl-padding)),
        calc(${bounds.minY}px - var(--tl-padding)))
        scale(var(--tl-scale))`
  }, [bounds.minX, bounds.minY, rotation, bounds.rotation])

  React.useLayoutEffect(() => {
    const elm = ref.current!
    elm.style.width = `calc(${Math.floor(bounds.width)}px + (var(--tl-padding) * 2))`
    elm.style.height = `calc(${Math.floor(bounds.height)}px + (var(--tl-padding) * 2))`
  }, [bounds.width, bounds.height])

  React.useLayoutEffect(() => {
    const elm = ref.current!
    if (zIndex !== undefined) elm.style.zIndex = zIndex.toString()
  }, [zIndex])
}
