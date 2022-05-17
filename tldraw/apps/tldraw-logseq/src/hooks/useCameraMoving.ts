import * as React from 'react'
import { useApp } from '@tldraw/react'
import { useGesture } from '@use-gesture/react'
import type { TLViewport } from '@tldraw/core'

function useSampling(fn: () => void, rate: number) {
  React.useEffect(() => {
    const interval = setInterval(fn, 1000 / rate)
    return () => clearInterval(interval)
  }, [fn, rate])
}

function now() {
  return new Date().getTime()
}

export function useCameraMovingRef(bias = 10, timeout = 1000) {
  const app = useApp()
  const movingRef = React.useRef<boolean>(false)
  const prevCamera = React.useRef<TLViewport['camera']>()
  const lastMovingRef = React.useRef<number>(now())
  const sampleFn = React.useCallback(() => {
    const { point, zoom } = app.viewport.camera
    if (prevCamera.current) {
      const { point: prevPoint } = prevCamera.current
      const moving = Math.abs(point[0] - prevPoint[0]) + Math.abs(point[1] - prevPoint[1]) > bias
      if (moving) {
        movingRef.current = true
        lastMovingRef.current = now()
      } else if (now() - lastMovingRef.current > timeout) {
        movingRef.current = false
      }
    }
    prevCamera.current = {
      point: [...point],
      zoom,
    }
  }, [app])

  useGesture(
    {
      // immediately set moving to false
      onMouseDown: () => {
        movingRef.current = false
      },
    },
    {
      eventOptions: {
        capture: true,
      },
      target: window
    }
  )

  useSampling(sampleFn, 30)
  return movingRef
}
