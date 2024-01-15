import type { TLEventMap, TLEventInfo, TLEvents } from '../../../../types'
import type { TLDrawShape, TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLDrawTool } from '../TLDrawTool'

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
  T extends S & TLDrawShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLDrawTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pinching'

  private origin: number[] = [0, 0]

  private prevDelta: number[] = [0, 0]

  onEnter = (info: GestureInfo<S, K>) => {
    this.prevDelta = info.info.delta
    this.origin = info.info.point
  }

  onPinch: TLEvents<S>['pinch'] = info => {
    this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2])
  }

  onPinchEnd: TLEvents<S>['pinch'] = () => {
    this.tool.transition('idle')
  }
}
