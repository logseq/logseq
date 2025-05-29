import * as React from 'react'
import { TLSelectionHandle, TLTargetType } from '@tldraw/core'
import { DOUBLE_CLICK_DURATION } from '../constants'
import type { TLReactCustomEvents } from '../types'
import { useRendererContext } from './useRendererContext'

export function useBoundsEvents(handle: TLSelectionHandle) {
  const { callbacks } = useRendererContext()

  const rDoubleClickTimer = React.useRef<number>(-1)

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (order) return
      callbacks.onPointerMove?.({ type: TLTargetType.Selection, handle, order }, e)
      e.order = order + 1
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (order) return
      // See note at bottom of the file
      const elm = loopToHtmlElement(e.currentTarget)
      elm.setPointerCapture(e.pointerId)
      elm.addEventListener('pointerup', onPointerUp)
      callbacks.onPointerDown?.({ type: TLTargetType.Selection, handle, order }, e)
      e.order = order + 1
    }

    const onPointerUp = (e: PointerEvent & { order?: number }) => {
      const { order = 0 } = e
      if (order) return
      const elm = e.target as HTMLElement
      elm.removeEventListener('pointerup', onPointerUp)
      elm.releasePointerCapture(e.pointerId)
      callbacks.onPointerUp?.({ type: TLTargetType.Selection, handle, order }, e)
      const now = Date.now()
      const elapsed = now - rDoubleClickTimer.current

      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          callbacks.onDoubleClick?.({ type: TLTargetType.Selection, handle, order }, e)
          rDoubleClickTimer.current = -1
        }
      }

      e.order = order + 1
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (order) return
      callbacks.onPointerEnter?.({ type: TLTargetType.Selection, handle, order }, e)
      e.order = order + 1
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (order) return
      callbacks.onPointerLeave?.({ type: TLTargetType.Selection, handle, order }, e)
      e.order = order + 1
    }

    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyDown?.({ type: TLTargetType.Selection, handle, order: -1 }, e)
    }

    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyUp?.({ type: TLTargetType.Selection, handle, order: -1 }, e)
    }

    return {
      onPointerDown,
      onPointerMove,
      // onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onKeyDown,
      onKeyUp,
    }
  }, [callbacks])

  return events
}

function loopToHtmlElement(elm: Element): HTMLElement {
  if (elm.namespaceURI?.endsWith('svg')) {
    if (elm.parentElement) return loopToHtmlElement(elm.parentElement)
    else throw Error('Could not find a parent element of an HTML type!')
  }
  return elm as HTMLElement
}

/*
There are a few hacks here in facilitate double clicking and pointer
capture on elements.

The events in this file are possibly set on individual SVG elements,
such as handles or corner handles, rather than on HTML elements or
SVGSVGElements. Raw SVG elements do not support pointerCapture in
most cases, meaning that in order for pointer capture to work, we
need to crawl up the DOM tree to find the nearest HTML element. Then,
in order for that element to also call the `onPointerUp` event from
this file, we need to manually set that event on that element and
later remove it when the pointerup occurs. This is a potential leak
if the user clicks on a handle but the pointerup does not fire for
whatever reason.
*/
