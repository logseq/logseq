/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { TLReactShape } from '~lib'
import { useApp } from '~hooks'
import type { AppProps } from './App'
import { Renderer } from './Renderer'

export const AppCanvas = observer(function InnerApp<S extends TLReactShape>(
  props: AppProps<S>
): JSX.Element {
  const app = useApp<S>()

  return (
    <Renderer
      viewport={app.viewport}
      inputs={app.inputs}
      callbacks={app._events as any}
      brush={app.brush}
      editingShape={app.editingShape}
      hoveredShape={app.hoveredShape}
      selectionDirectionHint={app.selectionDirectionHint}
      selectionBounds={app.selectionBounds}
      selectedShapes={app.selectedShapesArray}
      erasingShapes={app.erasingShapesArray}
      shapes={app.shapesInViewport}
      assets={app.assets}
      showGrid={app.settings.showGrid}
      showSelection={app.showSelection}
      showSelectionRotation={app.showSelectionRotation}
      showResizeHandles={app.showResizeHandles}
      showRotateHandles={app.showRotateHandles}
      showSelectionDetail={app.showSelectionDetail}
      showContextBar={app.showContextBar}
      cursor={app.cursors.cursor}
      cursorRotation={app.cursors.rotation}
      selectionRotation={app.selectionRotation}
      onEditingEnd={app.clearEditingShape}
      {...props}
    />
  )
})
