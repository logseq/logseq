import * as React from 'react'
import { TLTargetType } from '@tldraw/core'
import type { TLReactCustomEvents } from '../types'
import { useApp } from './useApp'
import { useRendererContext } from './useRendererContext'

export function useKeyboardEvents(ref: React.RefObject<HTMLDivElement>) {
  const app = useApp()
  const { callbacks } = useRendererContext()
  const shiftKeyDownRef = React.useRef(false)

  React.useEffect(() => {
    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      if (ref.current?.contains(document.activeElement)) {
        callbacks.onKeyDown?.({ type: TLTargetType.Canvas, order: -1 }, e)
        shiftKeyDownRef.current = e.shiftKey
      }
    }

    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      if (ref.current?.contains(document.activeElement)) {
        callbacks.onKeyUp?.({ type: TLTargetType.Canvas, order: -1 }, e)
        shiftKeyDownRef.current = e.shiftKey
      }
    }

    const onPaste = (e: ClipboardEvent) => {
      if (
        !app.editingShape &&
        ref.current?.contains(document.activeElement) &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')
      ) {
        e.preventDefault()
        app.paste(e, shiftKeyDownRef.current)
      }
    }

    const onCopy = (e: ClipboardEvent) => {
      if (
        !app.editingShape &&
        app.selectedShapes.size > 0 &&
        ref.current?.contains(document.activeElement) &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')
      ) {
        e.preventDefault()
        app.copy()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('paste', onPaste)
    document.addEventListener('copy', onCopy)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('copy', onCopy)
    }
  }, [])
}
