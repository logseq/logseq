/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape } from '../../lib'
import { TablerIcon } from '../icons'
import { Button } from '../Button'
import { ZoomMenu } from '../ZoomMenu'
import * as Separator from '@radix-ui/react-separator'

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
    <div className="tl-action-bar" data-html2canvas-ignore="true">
      {!app.readOnly && (
        <div className="tl-toolbar tl-history-bar">
          <Button tooltip="Undo" onClick={undo}>
            <TablerIcon name="arrow-back-up" />
          </Button>
          <Button tooltip="Redo" onClick={redo}>
            <TablerIcon name="arrow-forward-up" />
          </Button>
        </div>
      )}

      <div className={`tl-toolbar tl-zoom-bar ${app.readOnly ? '' : 'ml-4'}`}>
        <Button tooltip="Zoom in" onClick={zoomIn} id="tl-zoom-in">
          <TablerIcon name="plus" />
        </Button>
        <Button tooltip="Zoom out" onClick={zoomOut} id="tl-zoom-out">
          <TablerIcon name="minus" />
        </Button>
        <Separator.Root className="tl-toolbar-separator" orientation="vertical" />
        <ZoomMenu />
      </div>
    </div>
  )
})
