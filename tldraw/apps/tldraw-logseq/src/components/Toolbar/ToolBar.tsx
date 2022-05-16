/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '~lib'
import { useApp } from '@tldraw/react'

export const ToolBar = observer(function ToolBar(): JSX.Element {
  const app = useApp<Shape>()

  const zoomIn = React.useCallback(() => {
    app.api.zoomIn()
  }, [app])

  const zoomOut = React.useCallback(() => {
    app.api.zoomOut()
  }, [app])

  const resetZoom = React.useCallback(() => {
    app.api.resetZoom()
  }, [app])

  const zoomToFit = React.useCallback(() => {
    app.api.zoomToFit()
  }, [app])

  const zoomToSelection = React.useCallback(() => {
    app.api.zoomToSelection()
  }, [app])

  const sendToBack = React.useCallback(() => {
    app.sendToBack()
  }, [app])

  const sendBackward = React.useCallback(() => {
    app.sendBackward()
  }, [app])

  const bringToFront = React.useCallback(() => {
    app.bringToFront()
  }, [app])

  const bringForward = React.useCallback(() => {
    app.bringForward()
  }, [app])

  const flipHorizontal = React.useCallback(() => {
    app.flipHorizontal()
  }, [app])

  const flipVertical = React.useCallback(() => {
    app.flipVertical()
  }, [app])

  return (
    <div className="toolbar">
      <button onClick={sendToBack}>Send to Back</button>
      <button onClick={sendBackward}>Send Backward</button>
      <button onClick={bringForward}>Bring Forward</button>
      <button onClick={bringToFront}>Bring To Front</button>|<button onClick={zoomOut}>-</button>
      <button onClick={zoomIn}>+</button>
      <button onClick={resetZoom}>reset</button>
      <button onClick={zoomToFit}>zoom to fit</button>
      <button onClick={zoomToSelection}>zoom to selection</button>
    </div>
  )
})
