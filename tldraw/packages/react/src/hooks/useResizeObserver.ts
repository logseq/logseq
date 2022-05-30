import * as React from 'react'
import type { TLViewport, TLBounds } from '@tldraw/core'

const getNearestScrollableContainer = (element: HTMLElement): HTMLElement | Document => {
  let parent = element.parentElement
  while (parent) {
    if (parent === document.body) {
      return document
    }
    const { overflowY } = window.getComputedStyle(parent)
    const hasScrollableContent = parent.scrollHeight > parent.clientHeight
    if (
      hasScrollableContent &&
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
    ) {
      return parent
    }
    parent = parent.parentElement
  }
  return document
}

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T>,
  viewport: TLViewport,
  onBoundsChange?: (bounds: TLBounds) => void
) {
  const rIsMounted = React.useRef(false)

  // When the element resizes, update the bounds (stored in inputs)
  // and broadcast via the onBoundsChange callback prop.
  const updateBounds = React.useCallback(() => {
    if (rIsMounted.current) {
      const rect = ref.current?.getBoundingClientRect()

      if (rect) {
        const bounds: TLBounds = {
          minX: rect.left,
          maxX: rect.left + rect.width,
          minY: rect.top,
          maxY: rect.top + rect.height,
          width: rect.width,
          height: rect.height,
        }

        viewport.updateBounds(bounds)
        onBoundsChange?.(bounds)
      }
    } else {
      // Skip the first mount
      rIsMounted.current = true
    }
  }, [ref, onBoundsChange])

  React.useEffect(() => {
    const scrollingAnchor = ref.current ? getNearestScrollableContainer(ref.current) : document
    scrollingAnchor.addEventListener('scroll', updateBounds)
    scrollingAnchor.addEventListener('resize', updateBounds)
    return () => {
      scrollingAnchor.removeEventListener('scroll', updateBounds)
      scrollingAnchor.removeEventListener('resize', updateBounds)
    }
  }, [])

  React.useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0].contentRect) {
        updateBounds()
      }
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref])

  React.useLayoutEffect(() => {
    updateBounds()
  }, [ref])
}
