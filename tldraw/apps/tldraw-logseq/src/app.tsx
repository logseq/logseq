/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLDocumentModel } from '@tldraw/core'
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
import { LogseqContext } from '~lib/logseq-context'
import { Shape, shapes } from '~lib/shapes'
import {
  HighlighterTool,
  HTMLTool,
  LineTool,
  LogseqPortalTool,
  NuEraseTool,
  PencilTool,
  TextTool,
  YouTubeTool,
} from '~lib/tools'

const components: TLReactComponents<Shape> = {
  ContextBar: ContextBar,
}

const tools: TLReactToolConstructor<Shape>[] = [
  // BoxTool,
  // DotTool,
  // EllipseTool,
  // PolygonTool,
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
  renderers: {
    Page: React.FC
    Breadcrumb: React.FC
    PageNameLink: React.FC
  }
  handlers: {
    search: (query: string) => string[]
    addNewBlock: (content: string) => string
  }
  model?: TLDocumentModel<Shape>
  onMount?: TLReactCallbacks<Shape>['onMount']
  onPersist?: TLReactCallbacks<Shape>['onPersist']
}

export const App = function App(props: LogseqTldrawProps): JSX.Element {
  const renderers: any = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(props.renderers).map(([key, comp]) => {
        return [key, React.memo(comp)]
      })
    )
  }, [])
  const contextValue = {
    renderers,
    handlers: props.handlers,
  }

  const onFileDrop = useFileDrop()
  const onPaste = usePaste(contextValue)
  const onQuickAdd = useQuickAdd()

  return (
    <LogseqContext.Provider
      value={{
        renderers,
        handlers: props.handlers,
      }}
    >
      <AppProvider
        Shapes={shapes}
        Tools={tools}
        onFileDrop={onFileDrop}
        onPaste={onPaste}
        onCanvasDBClick={onQuickAdd}
        {...props}
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
