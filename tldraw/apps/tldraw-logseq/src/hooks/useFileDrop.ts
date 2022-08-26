import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '../lib'
import type { LogseqContextValue } from '../lib/logseq-context'
import { usePaste } from './usePaste'

export function useFileDrop(context: LogseqContextValue) {
  const handlePaste = usePaste(context)
  return React.useCallback<TLReactCallbacks<Shape>['onFileDrop']>(async (app, { files, point }) => {
    handlePaste(app, { point, shiftKey: false, files })
  }, [])
}
