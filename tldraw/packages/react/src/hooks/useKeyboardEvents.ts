import * as React from 'react'
import { useApp, useRendererContext } from '~hooks'
import { TLTargetType } from '@tldraw/core'
import type { TLReactCustomEvents } from '~types'

export function useKeyboardEvents() {
  const app = useApp()
  const { callbacks } = useRendererContext()

  React.useEffect(() => {
    const onKeyDown: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyDown?.({ type: TLTargetType.Canvas, order: -1 }, e)
    }
    const onKeyUp: TLReactCustomEvents['keyboard'] = e => {
      callbacks.onKeyUp?.({ type: TLTargetType.Canvas, order: -1 }, e)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('paste', e => {
      if (!app.editingShape) {
        e.preventDefault()
        app.paste(e)
      }
    })
    document.addEventListener('copy', e => {
      if (!app.editingShape && app.selectedShapes.size > 0) {
        e.preventDefault()
        app.copy()
      }
    })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}
