/* eslint-disable @typescript-eslint/no-explicit-any */
import { observer } from 'mobx-react-lite'
import { useApp } from '../hooks'
import type { TLReactShape } from '../lib'
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
      hoveredGroup={app.hoveredGroup}
      bindingShapes={app.bindingShapes}
      selectionDirectionHint={app.selectionDirectionHint}
      selectionBounds={app.selectionBounds}
      selectedShapes={app.selectedShapesArray}
      erasingShapes={app.erasingShapesArray}
      shapes={app.shapes} // TODO: use shapes in viewport later?
      assets={app.assets}
      showGrid={app.settings.showGrid}
      penMode={app.settings.penMode}
      showSelection={app.showSelection}
      showSelectionRotation={app.showSelectionRotation}
      showResizeHandles={app.showResizeHandles}
      showRotateHandles={app.showRotateHandles}
      showCloneHandles={app.showCloneHandles}
      showSelectionDetail={app.showSelectionDetail}
      showContextBar={app.showContextBar}
      cursor={app.cursors.cursor}
      cursorRotation={app.cursors.rotation}
      selectionRotation={app.selectionRotation}
      onEditingEnd={app.clearEditingState}
      {...props}
    />
  )
})
