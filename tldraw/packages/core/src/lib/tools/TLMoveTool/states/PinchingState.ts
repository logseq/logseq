import type { TLEventMap, TLEventInfo, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLMoveTool } from '../TLMoveTool'

type GestureInfo<
  S extends TLShape,
  K extends TLEventMap,
  E extends TLEventInfo<S> = TLEventInfo<S>
> = {
  info: E & { delta: number[]; point: number[]; offset: number[] }
  event: K['wheel'] | K['pointer'] | K['touch'] | K['keyboard'] | K['gesture']
}

export class PinchingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLMoveTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pinching'

  private origin: number[] = [0, 0]

  private prevDelta: number[] = [0, 0]

  onEnter = (info: GestureInfo<S, K>) => {
    this.prevDelta = info.info.delta
    this.origin = info.info.point
  }

  onPinch: TLEvents<S>['pinch'] = info => {
    this.app.viewport.pinchCamera(info.point, [0, 0], info.offset[0])
  }

  onPinchEnd: TLEvents<S>['pinch'] = () => {
    this.tool.transition('idle')
  }
}
