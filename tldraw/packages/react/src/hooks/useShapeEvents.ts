import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import { useApp } from './useApp'
import { useRendererContext } from '.'
import { DOUBLE_CLICK_DURATION } from '../constants'
import type { TLReactShape } from '../lib'
import type { TLReactCustomEvents } from '../types'

export function useShapeEvents<S extends TLReactShape>(shape: S) {
  const app = useApp()
  const { inputs, callbacks } = useRendererContext()

  const rDoubleClickTimer = React.useRef<number>(-1)

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerMove?.({ type: TLTargetType.Shape, shape, order }, e)
      e.order = order + 1
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)
      callbacks.onPointerDown?.({ type: TLTargetType.Shape, shape, order }, e)
      e.order = order + 1
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      callbacks.onPointerUp?.({ type: TLTargetType.Shape, shape, order }, e)
      const now = Date.now()
      const elapsed = now - rDoubleClickTimer.current
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          callbacks.onDoubleClick?.({ type: TLTargetType.Shape, shape, order }, e)
          rDoubleClickTimer.current = -1
        }
      }
      e.order = order + 1
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerEnter?.({ type: TLTargetType.Shape, shape, order }, e)
      e.order = order + 1
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerLeave?.({ type: TLTargetType.Shape, shape, order }, e)
      e.order = order + 1
    }

    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyDown?.({ type: TLTargetType.Shape, shape, order: -1 }, e)
      // FIXME
      // e.stopPropagation()
    }

    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyUp?.({ type: TLTargetType.Shape, shape, order: -1 }, e)
      // FIXME
      // e.stopPropagation()
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

function setCaptureOnAncestorDiv(elm: Element, pointerId: number): void {
  if (elm.tagName === 'DIV') elm.setPointerCapture(pointerId)
  else if (elm.parentElement) setCaptureOnAncestorDiv(elm.parentElement, pointerId)
}
