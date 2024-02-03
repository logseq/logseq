import type { TLEventMap, TLEventInfo, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

type GestureInfo<
  S extends TLShape,
  K extends TLEventMap,
  E extends TLEventInfo<S> = TLEventInfo<S>
> = {
  info: E & { delta: number[]; point: number[]; offset: number[] }
  event: K['pointer'] | K['touch'] | K['keyboard'] | K['gesture']
}

export class PinchingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pinching'

  onPinch: TLEvents<S>['pinch'] = (info, event: any) => {
    this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2])
  }

  onPinchEnd: TLEvents<S>['pinch'] = () => {
    this.tool.transition('idle')
  }

  onPointerDown: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }
}
