import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import { useApp } from './useApp'
import { DOUBLE_CLICK_DURATION } from '../constants'
import type { TLReactCustomEvents } from '../types'
import { useRendererContext } from './useRendererContext'

export function useCanvasEvents() {
  const app = useApp()
  const { callbacks } = useRendererContext()

  const rDoubleClickTimer = React.useRef<number>(-1)

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerMove?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)

      if (!e.isPrimary) {
        // ignore secondary pointers (in multi-touch scenarios)
        return
      }

      callbacks.onPointerDown?.({ type: TLTargetType.Canvas, order }, e)

      const now = Date.now()
      const elapsed = now - rDoubleClickTimer.current
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          callbacks.onDoubleClick?.({ type: TLTargetType.Canvas, order }, e)
          rDoubleClickTimer.current = -1
        }
      }
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      callbacks.onPointerUp?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerEnter?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      if (app.settings.penMode && (e.pointerType !== 'pen' || !e.isPrimary)) {
        return
      }

      const { order = 0 } = e
      callbacks.onPointerLeave?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onDrop = async (e: React.DragEvent<Element>) => {
      e.preventDefault()

      if ('clientX' in e) {
        const point = [e.clientX, e.clientY]
        app.drop(e.dataTransfer, point)
      }
    }

    const onDragOver = (e: React.DragEvent<Element>) => {
      e.preventDefault()
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onDrop,
      onDragOver,
      // fix touch callout in iOS
      onTouchEnd: (e: TouchEvent) => {
        let tool = app.selectedTool.id
        if (tool === 'pencil' || tool === 'highlighter') {
          e.preventDefault()
        }
      }
    }
  }, [callbacks])

  return events
}
