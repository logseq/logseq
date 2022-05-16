import type { TLBoxTool } from '../TLBoxTool'
import { TLShape, TLApp, TLToolState, TLBoxShape } from '~lib'
import type { TLEventMap, TLStateEvents } from '~types'

export class IdleState<
  S extends TLShape,
  T extends TLBoxShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLBoxTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'idle'

  onPointerDown: TLStateEvents<S, K>['onPointerDown'] = (info, e) => {
    if (info.order) return
    this.tool.transition('pointing')
  }

  onPinchStart: TLStateEvents<S, K>['onPinchStart'] = (...args) => {
    this.app.transition('select', { returnTo: 'box' })
    this.app.onPinchStart?.(...args)
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.transition('select')
        break
      }
    }
  }
}
