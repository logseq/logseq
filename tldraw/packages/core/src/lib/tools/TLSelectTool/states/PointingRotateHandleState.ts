import { Vec } from '@tldraw/vec'
import { CURSORS } from '~constants'
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import { TLCursor, TLEventMap, TLEvents, TLEventSelectionInfo, TLSelectionHandle } from '~types'

export class PointingRotateHandleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingRotateHandle'

  cursor = TLCursor.Rotate

  private handle = '' as TLSelectionHandle

  onEnter = (info: TLEventSelectionInfo) => {
    this.handle = info.handle
    this.updateCursor()
  }

  onWheel: TLEvents<S>['wheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('rotating', { handle: this.handle })
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  private updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation)
  }
}
