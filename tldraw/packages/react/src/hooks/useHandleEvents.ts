/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import { useRendererContext } from '~hooks'
import type { TLReactShape } from '~lib'
import type { TLReactCustomEvents } from '~types'

export function useHandleEvents<S extends TLReactShape = TLReactShape>(shape: S, index: number) {
  const { inputs, callbacks } = useRendererContext()

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![index]
      callbacks.onPointerMove?.({ type: TLTargetType.Handle, shape, handle, index, order }, e)
      e.order = order + 1
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)
      const handle = shape.props.handles![index]
      callbacks.onPointerDown?.({ type: TLTargetType.Handle, shape, handle, index, order }, e)
      e.order = order + 1
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      const handle = shape.props.handles![index]
      callbacks.onPointerUp?.({ type: TLTargetType.Handle, shape, handle, index, order }, e)
      e.order = order + 1
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![index]
      callbacks.onPointerEnter?.({ type: TLTargetType.Handle, shape, handle, index, order }, e)
      e.order = order + 1
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      const handle = shape.props.handles![index]
      callbacks.onPointerLeave?.({ type: TLTargetType.Handle, shape, handle, index, order }, e)
      e.order = order + 1
    }

    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      const handle = shape.props.handles![index]
      callbacks.onKeyDown?.({ type: TLTargetType.Handle, shape, handle, index, order: -1 }, e)
    }

    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      const handle = shape.props.handles![index]
      callbacks.onKeyUp?.({ type: TLTargetType.Handle, shape, handle, index, order: -1 }, e)
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
