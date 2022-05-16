import { Vec } from '@tldraw/vec'
import { TLApp, TLSelectTool, TLToolState, TLShape } from '~lib'
import type { TLEventMap, TLEvents, TLEventShapeInfo } from '~types'

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

  onWheel: TLEvents<S>['wheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('translating')
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
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

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
