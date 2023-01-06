import { Vec } from '@tldraw/vec'
import { type TLEventMap, TLCursor, type TLHandle, type TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class PointingHandleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingHandle'

  cursor = TLCursor.Grabbing

  private info = {} as { shape: S; target: S; handle: TLHandle; index: number }

  onEnter = (info: { shape: S; target: S; handle: TLHandle; index: number }) => {
    this.info = info
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('translatingHandle', this.info)
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
