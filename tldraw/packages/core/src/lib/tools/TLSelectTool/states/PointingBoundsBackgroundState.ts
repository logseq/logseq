import { Vec } from '@tldraw/vec'
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import { TLCursor, TLEventMap, TLEvents } from '~types'

export class PointingBoundsBackgroundState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingBoundsBackground'

  private pointedSelectedShape?: S

  cursor = TLCursor.Move

  onEnter = () => {
    // If there is exactly a single shape
    if (this.app.selectedShapes.size === 1) {
      this.pointedSelectedShape = this.app.selectedShapesArray[0]
    }
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
    if (this.pointedSelectedShape?.canActivate) {
      this.app.setActivatedShapes([this.pointedSelectedShape.id])
    }
    this.app.setSelectedShapes([])
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
