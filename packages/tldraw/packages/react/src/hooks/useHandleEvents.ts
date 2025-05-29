/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import type { TLReactShape } from '../lib'
import type { TLReactCustomEvents } from '../types'
import { useRendererContext } from './useRendererContext'

export function useHandleEvents<S extends TLReactShape = TLReactShape>(shape: S, id: string) {
  const { inputs, callbacks } = useRendererContext()

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![id]
      callbacks.onPointerMove?.({ type: TLTargetType.Handle, shape, handle, id, order }, e)
      e.order = order + 1
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)
      const handle = shape.props.handles![id]
      callbacks.onPointerDown?.({ type: TLTargetType.Handle, shape, handle, id, order }, e)
      e.order = order + 1
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      const handle = shape.props.handles![id]
      callbacks.onPointerUp?.({ type: TLTargetType.Handle, shape, handle, id, order }, e)
      e.order = order + 1
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![id]
      callbacks.onPointerEnter?.({ type: TLTargetType.Handle, shape, handle, id, order }, e)
      e.order = order + 1
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![id]
      callbacks.onPointerLeave?.({ type: TLTargetType.Handle, shape, handle, id, order }, e)
      e.order = order + 1
    }

    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      const handle = shape.props.handles![id]
      callbacks.onKeyDown?.({ type: TLTargetType.Handle, shape, handle, id, order: -1 }, e)
    }

    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      const handle = shape.props.handles![id]
      callbacks.onKeyUp?.({ type: TLTargetType.Handle, shape, handle, id, order: -1 }, e)
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onKeyUp,
      onKeyDown,
    }
  }, [shape.id, inputs, callbacks])

  return events
}
