import { TLApp, TLShape, TLToolState } from '~lib'
import type { TLEventMap, TLEvents, TLStateEvents } from '~types'
import type { TLMoveTool } from '../TLMoveTool'

export class IdleHoldState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLMoveTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'idleHold'

  onPointerDown: TLStateEvents<S, K>['onPointerDown'] = (info, e) => {
    if (info.order) return
    this.tool.transition('panning', { prevState: 'idleHold' })
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
