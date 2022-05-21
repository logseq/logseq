/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLDocumentModel } from '@tldraw/core'
import {
  AppCanvas,
  AppProvider,
  TLReactCallbacks,
  TLReactComponents,
  TLReactShapeConstructor,
  TLReactToolConstructor,
} from '@tldraw/react'
import * as React from 'react'
import { AppUI } from '~components/AppUI'
import { ContextBar } from '~components/ContextBar/ContextBar'
import { useFileDrop } from '~hooks/useFileDrop'
import { LogseqContext } from '~lib/logseq-context'
import {
  BoxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  LogseqPortalShape,
  PenShape,
  PolygonShape,
  Shape,
  TextShape,
  YouTubeShape,
} from '~lib/shapes'
import {
  BoxTool,
  DotTool,
  EllipseTool,
  HighlighterTool,
  LineTool,
  LogseqPortalTool,
  NuEraseTool,
  PenTool,
  PolygonTool,
  TextTool,
  YouTubeTool,
} from '~lib/tools'

const components: TLReactComponents<Shape> = {
  ContextBar: ContextBar,
}

const shapes: TLReactShapeConstructor<Shape>[] = [
  BoxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  PenShape,
  PolygonShape,
  TextShape,
  YouTubeShape,
  LogseqPortalShape,
]

const tools: TLReactToolConstructor<Shape>[] = [
  BoxTool,
  DotTool,
  EllipseTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PenTool,
  PolygonTool,
  TextTool,
  YouTubeTool,
  LogseqPortalTool,
]

interface LogseqTldrawProps {
  PageComponent: any
  searchHandler: (query: string) => string[]
  model?: TLDocumentModel<Shape>
  onMount?: TLReactCallbacks<Shape>['onMount']
  onPersist?: TLReactCallbacks<Shape>['onPersist']
}

export const App = function App(props: LogseqTldrawProps): JSX.Element {
  const onFileDrop = useFileDrop()

  const Page = React.useMemo(() => React.memo(props.PageComponent), [])

  return (
    <LogseqContext.Provider value={{ Page, search: props.searchHandler }}>
      <AppProvider
        onMount={props.onMount}
        Shapes={shapes}
        Tools={tools}
        onFileDrop={onFileDrop}
        {...props}
      >
        <div className="logseq-tldraw logseq-tldraw-wrapper">
          <AppCanvas components={components} />
          <AppUI />
        </div>
      </AppProvider>
    </LogseqContext.Provider>
  )
}
