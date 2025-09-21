import { type TLEventMap, type TLStateEvents, type TLEvents, TLTargetType } from '../../../../types'
import type { TLShape, TLLineShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLLineTool } from '../TLLineTool'

export class IdleState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLLineTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'idle'

  onPointerDown: TLStateEvents<S, K>['onPointerDown'] = (info, e) => {
    if (info.order) return
    this.tool.transition('pointing')
  }

  onPinchStart: TLStateEvents<S, K>['onPinchStart'] = (...args) => {
    this.app.transition('select', { returnTo: this.app.currentState.id })
    this.app._events.onPinchStart?.(...args)
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.transition('select')
        break
      }
    }
  }

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
}
