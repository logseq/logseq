import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import { useApp } from './useApp'
import type { TLReactCustomEvents } from '../types'
import { useRendererContext } from './useRendererContext'

export function useMinimapEvents() {
  const app = useApp()
  const { callbacks } = useRendererContext()

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerMove?.({ type: TLTargetType.Minimap, order }, e)
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)
      callbacks.onPointerDown?.({ type: TLTargetType.Minimap, order }, e)
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      callbacks.onPointerUp?.({ type: TLTargetType.Minimap, order }, e)
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerEnter?.({ type: TLTargetType.Minimap, order }, e)
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerLeave?.({ type: TLTargetType.Minimap, order }, e)
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
    }
  }, [callbacks])

  return events
}
