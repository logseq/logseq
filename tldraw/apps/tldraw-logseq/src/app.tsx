/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLDocumentModel } from '@tldraw/core'
import {
  AppCanvas,
  AppProvider,
  TLReactCallbacks,
  TLReactToolConstructor,
  useApp,
} from '@tldraw/react'
import * as React from 'react'
import { AppUI } from './components/AppUI'
import { ContextBar } from './components/ContextBar'
import { ContextMenu } from './components/ContextMenu'
import { QuickLinks } from './components/QuickLinks'
import { useDrop } from './hooks/useDrop'
import { usePaste } from './hooks/usePaste'
import { useCopy } from './hooks/useCopy'
import { useQuickAdd } from './hooks/useQuickAdd'
import {
  BoxTool,
  EllipseTool,
  HighlighterTool,
  HTMLTool,
  IFrameTool,
  LineTool,
  LogseqPortalTool,
  NuEraseTool,
  PencilTool,
  PolygonTool,
  shapes,
  TextTool,
  YouTubeTool,
  type Shape,
} from './lib'
import { LogseqContext, type LogseqContextValue } from './lib/logseq-context'

const tools: TLReactToolConstructor<Shape>[] = [
  BoxTool,
  EllipseTool,
  PolygonTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PencilTool,
  TextTool,
  YouTubeTool,
  IFrameTool,
  HTMLTool,
  LogseqPortalTool,
]

interface LogseqTldrawProps {
  renderers: LogseqContextValue['renderers']
  handlers: LogseqContextValue['handlers']
  readOnly: boolean
  model?: TLDocumentModel<Shape>
  onMount?: TLReactCallbacks<Shape>['onMount']
  onPersist?: TLReactCallbacks<Shape>['onPersist']
}

const BacklinksCount: LogseqContextValue['renderers']['BacklinksCount'] = props => {
  const { renderers } = React.useContext(LogseqContext)

  const options = { 'portal?': false }

  return <renderers.BacklinksCount {...props} options={options} />
}

const AppImpl = () => {
  const ref = React.useRef<HTMLDivElement>(null)
  const app = useApp()

  const components = React.useMemo(
    () => ({
      ContextBar,
      BacklinksCount,
      QuickLinks,
    }),
    []
  )
  return (
    <ContextMenu collisionRef={ref}>
      <div ref={ref} className="logseq-tldraw logseq-tldraw-wrapper" data-tlapp={app.uuid}>
        <AppCanvas components={components}>
          <AppUI />
        </AppCanvas>
      </div>
    </ContextMenu>
  )
}

const AppInner = ({
  onPersist,
  readOnly,
  model,
  ...rest
}: Omit<LogseqTldrawProps, 'renderers' | 'handlers'>) => {
  const onDrop = useDrop()
  const onPaste = usePaste()
  const onCopy = useCopy()
  const onQuickAdd = readOnly ? null : useQuickAdd()

  const onPersistOnDiff: TLReactCallbacks<Shape>['onPersist'] = React.useCallback(
    (app, info) => {
      onPersist?.(app, info)
    },
    [model]
  )

  return (
    <AppProvider
      Shapes={shapes}
      Tools={tools}
      onDrop={onDrop}
      onPaste={onPaste}
      onCopy={onCopy}
      readOnly={readOnly}
      onCanvasDBClick={onQuickAdd}
      onPersist={onPersistOnDiff}
      model={model}
      {...rest}
    >
      <AppImpl />
    </AppProvider>
  )
}

export const App = function App({ renderers, handlers, ...rest }: LogseqTldrawProps): JSX.Element {
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

  return (
    <LogseqContext.Provider value={contextValue}>
      <AppInner {...rest} />
    </LogseqContext.Provider>
  )
}
