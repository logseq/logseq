import * as React from 'react'
import { useApp } from '~hooks'
import { renderWithApp } from '~test/renderWithApp'
import { Renderer } from './Renderer'

describe('HTMLLayer', () => {
  test('mounts component without crashing', () => {
    const Test = () => {
      const app = useApp()
      return (
        <Renderer
          viewport={app.viewport}
          inputs={app.inputs}
          callbacks={app._events}
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
        />
      )
    }
    renderWithApp(<Test />)
  })
})
