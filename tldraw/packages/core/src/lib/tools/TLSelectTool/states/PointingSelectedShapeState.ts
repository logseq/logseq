import { Vec } from '@tldraw/vec'
import type * as types from '../../../../types'
import type * as shapes from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class PointingSelectedShapeState<
  S extends shapes.TLShape,
  K extends types.TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingSelectedShape'

  private pointedSelectedShape?: S

  onEnter = (info: types.TLEventShapeInfo<S>) => {
    this.pointedSelectedShape = info.shape
  }

  onExit = () => {
    this.pointedSelectedShape = undefined
  }

  onWheel: types.TLEvents<S>['wheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onPointerMove: types.TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('translating')
    }
  }

  onPointerUp: types.TLEvents<S>['pointer'] = () => {
    const { shiftKey } = this.app.inputs
    if (!this.pointedSelectedShape) throw Error('Expected a pointed selected shape')
    if (shiftKey) {
      const { selectedIds } = this.app
      const next = Array.from(selectedIds.values())
      next.splice(next.indexOf(this.pointedSelectedShape.id), 1)
      this.app.setSelectedShapes(next)
    } else {
      this.app.setSelectedShapes([this.pointedSelectedShape.id])
    }
    this.tool.transition('idle')
  }

  onPinchStart: types.TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
