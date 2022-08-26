import * as React from 'react'
import { Canvas } from './Canvas'
import { useApp } from '~hooks'
import { renderWithApp } from '~test/renderWithApp'

describe('Canvas', () => {
  test('mounts component without crashing', () => {
    const Test = () => {
      const app = useApp()
      return (
        <Canvas
          brush={app.brush}
          hoveredShape={app.hoveredShape}
          selectionBounds={app.selectionBounds}
          selectedShapes={app.selectedShapesArray}
          erasingShapes={app.erasingShapesArray}
          shapes={app.shapesInViewport}
          showGrid={app.settings.showGrid}
          showSelection={app.showSelection}
          showSelectionRotation={app.showSelectionRotation}
          showResizeHandles={app.showResizeHandles}
          showRotateHandles={app.showRotateHandles}
          showSelectionDetail={app.showSelectionDetail}
          showContextBar={app.showContextBar}
          showContextMenu={app.showContextMenu}
        />
      )
    }

    renderWithApp(<Test />)
  })
})
