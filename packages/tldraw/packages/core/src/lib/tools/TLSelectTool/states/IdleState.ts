import { type TLEventMap, type TLEvents, TLTargetType } from '../../../../types'
import { PointUtils } from '../../../../utils'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class IdleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'idle'

  onEnter = (info: { fromId: string } & any) => {
    if (info.fromId === 'pinching' && this.parent.returnTo) {
      this.app.transition(this.parent.returnTo)
    }
  }

  onExit = () => {}

  onPointerEnter: TLEvents<S>['pointer'] = info => {
    if (info.order) return
    switch (info.type) {
      case TLTargetType.Shape: {
        this.app.setHoveredShape(info.shape.id)
        break
      }
      case TLTargetType.Selection: {
        if (!(info.handle === 'background' || info.handle === 'center')) {
          this.tool.transition('hoveringSelectionHandle', info)
        }
        break
      }
      case TLTargetType.Canvas: {
        this.app.setHoveredShape(undefined)
        break
      }
    }
  }

  onPointerDown: TLEvents<S>['pointer'] = (info, event) => {
    const {
      selectedShapes,
      inputs: { ctrlKey },
    } = this.app

    if (event.button === 2) {
      this.tool.transition('contextMenu', info)
      return
    }

    // Holding ctrlKey should ignore shapes
    if (ctrlKey) {
      this.tool.transition('pointingCanvas')
      return
    }

    switch (info.type) {
      case TLTargetType.Selection: {
        switch (info.handle) {
          case 'center': {
            break
          }
          case 'background': {
            this.tool.transition('pointingBoundsBackground')
            break
          }
          case 'rotate': {
            this.tool.transition('pointingRotateHandle')
            break
          }
          default: {
            this.tool.transition('pointingResizeHandle', info)
          }
        }
        break
      }
      case TLTargetType.Shape: {
        if (selectedShapes.has(info.shape)) {
          this.tool.transition('pointingSelectedShape', info)
        } else {
          const { selectionBounds, inputs } = this.app
          if (selectionBounds && PointUtils.pointInBounds(inputs.currentPoint, selectionBounds)) {
            this.tool.transition('pointingShapeBehindBounds', info)
          } else {
            this.tool.transition('pointingShape', info)
          }
        }
        break
      }
      case TLTargetType.Handle: {
        this.tool.transition('pointingHandle', info)
        break
      }
      case TLTargetType.Canvas: {
        this.tool.transition('pointingCanvas')
        break
      }
      case TLTargetType.Minimap: {
        this.tool.transition('pointingMinimap', { ...event, ...info })
        break
      }
    }
  }

  onPointerLeave: TLEvents<S>['pointer'] = info => {
    if (info.order) return

    if (info.type === TLTargetType.Shape) {
      if (this.app.hoveredId) {
        this.app.setHoveredShape(undefined)
      }
    }
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  onDoubleClick: TLEvents<S>['pointer'] = info => {
    if (info.order || this.app.selectedShapesArray.length !== 1 || this.app.readOnly) return

    const selectedShape = this.app.selectedShapesArray[0]
    if (!selectedShape.canEdit || selectedShape.props.isLocked) return

    switch (info.type) {
      case TLTargetType.Shape: {
        this.tool.transition('editingShape', info)
        break
      }
      case TLTargetType.Selection: {
        if (this.app.selectedShapesArray.length === 1) {
          this.tool.transition('editingShape', {
            type: TLTargetType.Shape,
            target: selectedShape,
          })
        }
        break
      }
    }
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    const { selectedShapesArray } = this.app
    switch (e.key) {
      case 'Enter': {
        if (
          selectedShapesArray.length === 1 &&
          selectedShapesArray[0].canEdit &&
          !this.app.readOnly
        ) {
          this.tool.transition('editingShape', {
            type: TLTargetType.Shape,
            shape: selectedShapesArray[0],
            order: 0,
          })
        }
        break
      }
      case 'Escape': {
        if (selectedShapesArray.length) {
          this.app.setSelectedShapes([])
        }
        break
      }
    }
  }
}
