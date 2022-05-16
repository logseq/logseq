import * as React from 'react'
import { useRendererContext } from '~hooks'
import { TLTargetType } from '@tldraw/core'
import type { TLReactCustomEvents } from '~types'

export function useKeyboardEvents() {
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
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}
