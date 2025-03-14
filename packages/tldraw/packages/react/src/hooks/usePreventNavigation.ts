/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as React from 'react'
import { useRendererContext } from './useRendererContext'

export function usePreventNavigation(rCanvas: React.RefObject<HTMLDivElement>): void {
  const context = useRendererContext()
  const {
    viewport: { bounds },
  } = context

  React.useEffect(() => {
    const preventGestureNavigation = (event: TouchEvent) => {
      event.preventDefault()
    }

    const preventNavigation = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        return
      }
      // Center point of the touch area
      const touchXPosition = event.touches[0].pageX
      // Size of the touch area
      const touchXRadius = event.touches[0].radiusX || 0

      // We set a threshold (10px) on both sizes of the screen,
      // if the touch area overlaps with the screen edges
      // it's likely to trigger the navigation. We prevent the
      // touchstart event in that case.
      if (touchXPosition - touchXRadius < 10 || touchXPosition + touchXRadius > bounds.width - 10) {
        event.preventDefault()
      }
    }

    const elm = rCanvas.current

    if (!elm) return () => void null

    elm.addEventListener('touchstart', preventGestureNavigation, {
      passive: true,
    })

    // @ts-ignore
    elm.addEventListener('gestureend', preventGestureNavigation, {
      passive: true,
    })

    // @ts-ignore
    elm.addEventListener('gesturechange', preventGestureNavigation, {
      passive: true,
    })

    // @ts-ignore
    elm.addEventListener('gesturestart', preventGestureNavigation, {
      passive: true,
    })

    // @ts-ignore
    elm.addEventListener('touchstart', preventNavigation, {
      passive: true,
    })

    return () => {
      if (elm) {
        elm.removeEventListener('touchstart', preventGestureNavigation)
        // @ts-ignore
        elm.removeEventListener('gestureend', preventGestureNavigation)
        // @ts-ignore
        elm.removeEventListener('gesturechange', preventGestureNavigation)
        // @ts-ignore
        elm.removeEventListener('gesturestart', preventGestureNavigation)
        // @ts-ignore
        elm.removeEventListener('touchstart', preventNavigation)
      }
    }
  }, [rCanvas, bounds.width])
}
