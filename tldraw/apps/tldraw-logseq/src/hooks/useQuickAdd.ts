import type { TLReactCallbacks } from '@tldraw/react'
import React from 'react'
import type { Shape } from '../lib'

export function useQuickAdd() {
  return React.useCallback<TLReactCallbacks<Shape>['onCanvasDBClick']>(async app => {
    // Give a timeout so that the quick add input will not be blurred too soon
    setTimeout(() => {
      app.transition('logseq-portal').selectedTool.transition('creating')
    }, 100)
  }, [])
}
