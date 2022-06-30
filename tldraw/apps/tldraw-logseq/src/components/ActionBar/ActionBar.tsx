/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '~lib'
import { App, useApp } from '@tldraw/react'
import { Minimap } from '~components/Minimap'
import { LogseqIcon, RedoIcon, UndoIcon } from '~components/icons'
import { ZoomInIcon, ZoomOutIcon } from '@radix-ui/react-icons'
import { ZoomContext } from '~components/ZoomContext'
import { Container } from '@tldraw/react/src/components'

export const ActionBar = observer(function ToolBar(): JSX.Element {
  const app = useApp<Shape>()
  const testFunction = () => {
    <ZoomContext ></ZoomContext>
  }
  //use state for if teh context bar should be open
  const [isOpen, setIsOpen] = React.useState(false)



  return (
    <div className="action-bar">
      <button onClick={app.api.undo}>
        <UndoIcon></UndoIcon>
      </button>
      <button onClick={app.api.redo}>
        <RedoIcon></RedoIcon>
      </button>
      <button onClick={app.api.zoomOut}>
        
      </button>
      <Container
      bounds={{minX: 500,
        maxX: 600,
        minY: 500,
        maxY: 600,
        width: 100,
        height: 100,}}>
      {
        isOpen && (
          <ZoomContext></ZoomContext>)
      }
      </Container>
      <button onClick={testFunction}>{(app.viewport.camera.zoom * 100).toFixed(0) + "%"} </button>
      <button onClick={app.api.zoomIn}>
        <ZoomInIcon></ZoomInIcon>
      </button>
    </div>
  )
})
