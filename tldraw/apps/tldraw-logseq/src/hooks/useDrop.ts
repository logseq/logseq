import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '../lib'
import { usePaste } from './usePaste'

export function useDrop() {
  const handlePaste = usePaste()
  return React.useCallback<TLReactCallbacks<Shape>['onDrop']>(
    async (app, { dataTransfer, point }) => {
      handlePaste(app, { point, shiftKey: false, dataTransfer, fromDrop: true })
    },
    []
  )
}
