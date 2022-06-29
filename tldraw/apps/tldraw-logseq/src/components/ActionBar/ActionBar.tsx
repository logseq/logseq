/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '~lib'
import { App, useApp } from '@tldraw/react'
import { Minimap } from '~components/Minimap'
import { LogseqIcon, RedoIcon, UndoIcon } from '~components/icons'
import { ZoomInIcon, ZoomOutIcon } from '@radix-ui/react-icons'

export const ActionBar = observer(function ToolBar(): JSX.Element {
  const app = useApp<Shape>()

  const testFunction = ()=> {
    console.log(app.viewport.camera.zoom)
    return app.viewport.camera.zoom //convert int to percentage
  }
  return (
    <div className="action-bar">
      <button onClick={app.api.undo}>
        <UndoIcon></UndoIcon>
      </button>
      <button onClick={app.api.redo}>
        <RedoIcon></RedoIcon>
      </button>
      <button onClick={app.api.zoomIn}>
        <ZoomInIcon></ZoomInIcon>
      </button>
      <button onClick={testFunction}>{(app.viewport.camera.zoom*100).toFixed(0)+"%"} </button>

      <button onClick={app.api.zoomOut}>
        <ZoomOutIcon></ZoomOutIcon>
      </button>
    </div>
  )
})
