/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLDocumentModel } from '@tldraw/core'
import type {
  TLReactCallbacks,
  TLReactComponents,
  TLReactShapeConstructor,
  TLReactToolConstructor,
} from '@tldraw/react'
import { AppCanvas, AppProvider } from '@tldraw/react'
import * as React from 'react'
import { AppUI } from '~components/AppUI'
import { ContextBar } from '~components/ContextBar/ContextBar'
import { useFileDrop } from '~hooks/useFileDrop'
import { LogseqContext } from '~lib/logseq-context'
import {
  BoxShape,
  CodeSandboxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  PenShape,
  PolygonShape,
  PolylineShape,
  Shape,
  StarShape,
  TextShape,
  YouTubeShape,
  LogseqPortalShape,
} from '~lib/shapes'
import {
  BoxTool,
  CodeSandboxTool,
  DotTool,
  EllipseTool,
  HighlighterTool,
  LineTool,
  LogseqPortalTool,
  NuEraseTool,
  PenTool,
  PolygonTool,
  StarTool,
  TextTool,
  YouTubeTool,
} from '~lib/tools'

const components: TLReactComponents<Shape> = {
  ContextBar: ContextBar,
}

const shapes: TLReactShapeConstructor<Shape>[] = [
  BoxShape,
  CodeSandboxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  PenShape,
  PolygonShape,
  PolylineShape,
  StarShape,
  TextShape,
  YouTubeShape,
  LogseqPortalShape,
]

const tools: TLReactToolConstructor<Shape>[] = [
  BoxTool,
  CodeSandboxTool,
  DotTool,
  EllipseTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PenTool,
  PolygonTool,
  StarTool,
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

  const Page = React.useMemo(() => React.memo(props.PageComponent), []);

  return (
    <LogseqContext.Provider
      value={{ Page, search: props.searchHandler }}
    >
      <AppProvider Shapes={shapes} Tools={tools} onFileDrop={onFileDrop} {...props}>
        <div className="logseq-tldraw logseq-tldraw-wrapper">
          <AppCanvas components={components} />
          <AppUI />
        </div>
      </AppProvider>
    </LogseqContext.Provider>
  )
}
