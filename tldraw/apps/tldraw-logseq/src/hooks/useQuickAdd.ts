import type { TLReactCallbacks } from '@tldraw/react'
import React from 'react'
import type { Shape } from '../lib'

export function useQuickAdd() {
  return React.useCallback<TLReactCallbacks<Shape>['onCanvasDBClick']>(async app => {
    app.selectTool('logseq-portal').selectedTool.transition('creating')
  }, [])
}
