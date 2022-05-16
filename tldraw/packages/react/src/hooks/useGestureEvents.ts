import Vec from '@tldraw/vec'
import type { Handler, WebKitGestureEvent } from '@use-gesture/core/types'
import { useGesture } from '@use-gesture/react'
import * as React from 'react'
import { useRendererContext } from '~hooks'
import { TLTargetType } from '@tldraw/core'

type PinchHandler = Handler<
  'pinch',
  WheelEvent | PointerEvent | TouchEvent | WebKitGestureEvent | KeyboardEvent
>

export function useGestureEvents(ref: React.RefObject<HTMLDivElement>) {
  const { viewport, inputs, callbacks } = useRendererContext()

  const events = React.useMemo(() => {
    const onWheel: Handler<'wheel', WheelEvent> = gesture => {
      const { event, delta } = gesture
      console.log(event.target)
      event.preventDefault()
      if (inputs.state === 'pinching') return
      if (Vec.isEqual(delta, [0, 0])) return
      callbacks.onWheel?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: gesture.delta,
          point: inputs.currentPoint,
        },
        event
      )
    }

    const onPinchStart: PinchHandler = gesture => {
      const elm = ref.current
      const { event } = gesture
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      if (inputs.state !== 'idle') return
      callbacks.onPinchStart?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: gesture.delta,
          offset: gesture.offset,
          point: gesture.origin,
        },
        event
      )
    }

    const onPinch: PinchHandler = gesture => {
      const elm = ref.current
      const { event } = gesture
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      if (inputs.state !== 'pinching') return
      callbacks.onPinch?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: gesture.delta,
          offset: gesture.offset,
          point: gesture.origin,
        },
        event
      )
    }

    const onPinchEnd: PinchHandler = gesture => {
      const elm = ref.current
      const { event } = gesture
      if (!(event.target === elm || elm?.contains(event.target as Node))) return
      if (inputs.state !== 'pinching') return
      callbacks.onPinchEnd?.(
        {
          type: TLTargetType.Canvas,
          order: 0,
          delta: gesture.delta,
          offset: gesture.offset,
          point: gesture.origin,
        },
        event
      )
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
      from: viewport.camera.zoom,
      scaleBounds: () => ({ from: viewport.camera.zoom, max: 8, min: 0.1 }),
    },
  })
}
