import Vec from '@tldraw/vec'
import type { Handler, WebKitGestureEvent } from '@use-gesture/core/types'
import { useGesture } from '@use-gesture/react'
import * as React from 'react'
import { isDarwin, TLTargetType, TLViewport } from '@tldraw/core'
import { useRendererContext } from './useRendererContext'

type PinchHandler = Handler<
  'pinch',
  WheelEvent | PointerEvent | TouchEvent | WebKitGestureEvent | KeyboardEvent
>

export function useGestureEvents(ref: React.RefObject<HTMLDivElement>) {
  const { viewport, inputs, callbacks } = useRendererContext()

  const rOriginPoint = React.useRef<number[] | undefined>(undefined)
  const rDelta = React.useRef<number[]>([0, 0])
  const rWheelTs = React.useRef<number>(0)

  const events = React.useMemo(() => {
    const onWheel: Handler<'wheel', WheelEvent> = gesture => {
      const { event } = gesture
      event.preventDefault()

      const [x, y, z] = normalizeWheel(event)

      if (inputs.state === 'pinching' || rWheelTs.current >= event.timeStamp) {
        return
      }

      rWheelTs.current = event.timeStamp

      if ((event.altKey || event.ctrlKey || event.metaKey) && event.buttons === 0) {
        const bounds = viewport.bounds
        const point = inputs.currentScreenPoint ?? [bounds.width / 2, bounds.height / 2]
        const delta = z / 100
        const zoom = viewport.camera.zoom
        viewport.onZoom(point, zoom - delta * zoom)
        return
      } else {
        const delta = Vec.mul(
          event.shiftKey && !isDarwin()
            ? // shift+scroll = pan horizontally
              [y, 0]
            : // scroll = pan vertically (or in any direction on a trackpad)
              [x, y],
          0.8
        )

        if (Vec.isEqual(delta, [0, 0])) {
          return
        }

        viewport.panCamera(delta)
      }
    }

    const onPinchStart: PinchHandler = ({ event, delta, offset, origin }) => {
      const elm = ref.current
      if (event instanceof WheelEvent) return
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      callbacks.onPinchStart?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: [...delta, offset[0]],
          offset: offset,
          point: Vec.sub(origin, inputs.containerOffset),
        },
        event
      )
      rOriginPoint.current = origin
      rDelta.current = [0, 0]
    }

    const onPinch: PinchHandler = ({ event, offset, origin }) => {
      const elm = ref.current
      if (event instanceof WheelEvent) return
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      if (!rOriginPoint.current) {
        rOriginPoint.current = origin
      }
      const delta = Vec.sub(rOriginPoint.current, origin)
      const trueDelta = Vec.sub(delta, rDelta.current)
      callbacks.onPinch?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: [...trueDelta, offset[0]],
          offset: offset,
          point: Vec.sub(origin, inputs.containerOffset),
        },
        event
      )
      rDelta.current = delta
    }

    const onPinchEnd: PinchHandler = ({ event, delta, offset, origin }) => {
      const elm = ref.current
      if (event instanceof WheelEvent) return
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      if (inputs.state !== 'pinching') return
      callbacks.onPinchEnd?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: [0, 0, offset[0]],
          offset: offset,
          point: Vec.sub(origin, inputs.containerOffset),
        },
        event
      )
      rDelta.current = [0, 0]
    }

    return {
      onWheel,
      onPinchStart,
      onPinchEnd,
      onPinch,
    }
  }, [callbacks])

  useGesture(events, {
    target: ref,
    eventOptions: { passive: false },
    pinch: {
      from: [viewport.camera.zoom, viewport.camera.zoom],
      scaleBounds: () => ({
        from: viewport.camera.zoom,
        max: TLViewport.maxZoom,
        min: TLViewport.minZoom,
      }),
    },
  })
}

// Adapted from https://stackoverflow.com/a/13650579
function normalizeWheel(event: WheelEvent) {
  const MAX_ZOOM_STEP = 10
  const { deltaY, deltaX } = event

  let deltaZ = 0

  if (event.ctrlKey || event.metaKey) {
    const signY = Math.sign(event.deltaY)
    const absDeltaY = Math.abs(event.deltaY)

    let dy = deltaY

    if (absDeltaY > MAX_ZOOM_STEP) {
      dy = MAX_ZOOM_STEP * signY
    }

    deltaZ = dy
  }

  return [deltaX, deltaY, deltaZ]
}
