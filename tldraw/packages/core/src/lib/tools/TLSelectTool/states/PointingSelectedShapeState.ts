import { Vec } from '@tldraw/vec'
import {
  type TLEventMap,
  type TLEventShapeInfo,
  type TLEvents,
  TLTargetType,
} from '../../../../types'
import { PointUtils } from '../../../../utils'
import { type TLShape, TLBoxShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class PointingSelectedShapeState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingSelectedShape'

  private pointedSelectedShape?: S

  onEnter = (info: TLEventShapeInfo<S>) => {
    this.pointedSelectedShape = info.shape
  }

  onExit = () => {
    this.pointedSelectedShape = undefined
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
      this.tool.transition('translating')
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    const { shiftKey, currentPoint } = this.app.inputs
    const { selectedShapesArray } = this.app
    if (!this.pointedSelectedShape) throw Error('Expected a pointed selected shape')
    if (shiftKey) {
      const { selectedIds } = this.app
      const next = Array.from(selectedIds.values())
      next.splice(next.indexOf(this.pointedSelectedShape.id), 1)
      this.app.setSelectedShapes(next)
    } else if (
      selectedShapesArray.length === 1 &&
      this.pointedSelectedShape.canEdit &&
      !this.app.readOnly &&
      !this.pointedSelectedShape.props.isLocked &&
      this.pointedSelectedShape instanceof TLBoxShape &&
      PointUtils.pointInBounds(currentPoint, this.pointedSelectedShape.bounds)
    ) {
      this.tool.transition('editingShape', {
        shape: this.pointedSelectedShape,
        order: 0,
        type: TLTargetType.Shape,
      })
      return
    } else {
      this.app.setSelectedShapes([this.pointedSelectedShape.id])
    }
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
