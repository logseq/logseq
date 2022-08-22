/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepEqual, TLApp, TLAsset, TLDocumentModel } from '@tldraw/core'
import {
  AppCanvas,
  AppProvider,
  TLReactCallbacks,
  TLReactComponents,
  TLReactToolConstructor,
} from '@tldraw/react'
import * as React from 'react'
import { AppUI } from '~components/AppUI'
import { ContextBar } from '~components/ContextBar/ContextBar'
import { useFileDrop } from '~hooks/useFileDrop'
import { usePaste } from '~hooks/usePaste'
import { useQuickAdd } from '~hooks/useQuickAdd'
import { LogseqContext, LogseqContextValue } from '~lib/logseq-context'
import { Shape, shapes } from '~lib/shapes'
import {
  BoxTool,
  // DotTool,
  EllipseTool,
  HighlighterTool,
  HTMLTool,
  LineTool,
  LogseqPortalTool,
  NuEraseTool,
  PencilTool,
  PolygonTool,
  TextTool,
  YouTubeTool,
} from '~lib/tools'

const components: TLReactComponents<Shape> = {
  ContextBar: ContextBar,
}

const tools: TLReactToolConstructor<Shape>[] = [
  BoxTool,
  // DotTool,
  EllipseTool,
  PolygonTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PencilTool,
  TextTool,
  YouTubeTool,
  HTMLTool,
  LogseqPortalTool,
]

interface LogseqTldrawProps {
  renderers: LogseqContextValue['renderers']
  handlers: LogseqContextValue['handlers']
  model?: TLDocumentModel<Shape>
  onMount?: TLReactCallbacks<Shape>['onMount']
  onPersist?: TLReactCallbacks<Shape>['onPersist']
}

export const App = function App({
  onPersist,
  handlers,
  renderers,
  model,
  ...rest
}: LogseqTldrawProps): JSX.Element {
  const memoRenders: any = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(renderers).map(([key, comp]) => {
        return [key, React.memo(comp)]
      })
    )
  }, [])
  const contextValue = {
    renderers: memoRenders,
    handlers: handlers,
  }

  const onFileDrop = useFileDrop(contextValue)
  const onPaste = usePaste(contextValue)
  const onQuickAdd = useQuickAdd()

  const onPersistOnDiff: TLReactCallbacks<Shape>['onPersist'] = React.useCallback(
    (app, info) => {
      if (!deepEqual(app.serialized, model)) {
        onPersist?.(app, info)
      }
    },
    [model]
  )

  return (
    <LogseqContext.Provider value={contextValue}>
      <AppProvider
        Shapes={shapes}
        Tools={tools}
        onFileDrop={onFileDrop}
        onPaste={onPaste}
        onCanvasDBClick={onQuickAdd}
        onPersist={onPersistOnDiff}
        model={model}
        {...rest}
      >
        <div className="logseq-tldraw logseq-tldraw-wrapper">
          <AppCanvas components={components}>
            <AppUI />
          </AppCanvas>
        </div>
      </AppProvider>
    </LogseqContext.Provider>
  )
}
