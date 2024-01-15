import { Vec } from '@tldraw/vec'
import { CURSORS } from '../../../../constants'
import {
  type TLEventMap,
  TLCursor,
  type TLSelectionHandle,
  type TLEventSelectionInfo,
  type TLEvents,
} from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

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
    // Pause the history when we enter
    this.app.history.pause()
    this.handle = info.handle
    this.updateCursor()
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('rotating', { handle: this.handle })
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  private updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation)
  }
}
