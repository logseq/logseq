/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape } from '../../lib'
import { TablerIcon } from '../icons'
import { ZoomMenu } from '../ZoomMenu'

export const ActionBar = observer(function ActionBar(): JSX.Element {
  const app = useApp<Shape>()
  const undo = React.useCallback(() => {
    app.api.undo()
  }, [app])

  const redo = React.useCallback(() => {
    app.api.redo()
  }, [app])

  const zoomIn = React.useCallback(() => {
    app.api.zoomIn()
  }, [app])

  const zoomOut = React.useCallback(() => {
    app.api.zoomOut()
  }, [app])

  return (
    <div className="tl-action-bar">
      <div className="tl-history-bar">
        <button title="Undo" onClick={undo}>
          <TablerIcon name="arrow-back-up" />
        </button>
        <button title="Redo" onClick={redo}>
          <TablerIcon name="arrow-forward-up" />
        </button>
      </div>

      <div className="tl-zoom-bar">
        <button title="Zoom in" onClick={zoomIn} id="tl-zoom-in">
          <TablerIcon name="plus" />
        </button>
        <button title="Zoom out" onClick={zoomOut} id="tl-zoom-out">
          <TablerIcon name="minus" />
        </button>
        <ZoomMenu />
      </div>
    </div>
  )
})
