import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '../lib'
import type { LogseqContextValue } from '../lib/logseq-context'
import { usePaste } from './usePaste'

export function useDrop(context: LogseqContextValue) {
  const handlePaste = usePaste(context)
  return React.useCallback<TLReactCallbacks<Shape>['onDrop']>(async (app, { dataTransfer, point }) => {
    handlePaste(app, { point, shiftKey: false, dataTransfer })
  }, [])
}
