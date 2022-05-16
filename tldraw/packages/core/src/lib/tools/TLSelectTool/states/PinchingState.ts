import { Vec } from '@tldraw/vec'
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import type { TLEventInfo, TLEventMap, TLEvents } from '~types'

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
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pinching'

  private origin: number[] = [0, 0]

  private prevDelta: number[] = [0, 0]

  private pinchCamera(point: number[], delta: number[], zoom: number) {
    const { camera } = this.app.viewport
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
    const p1 = Vec.sub(Vec.div(point, zoom), nextPoint)
    this.app.setCamera(Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom)
  }

  onEnter = (info: GestureInfo<S, K>) => {
    this.prevDelta = info.info.delta
    this.origin = info.info.point
  }

  onPinch: TLEvents<S>['pinch'] = info => {
    this.pinchCamera(info.point, [0, 0], info.offset[0])
  }

  onPinchEnd: TLEvents<S>['pinch'] = () => {
    this.tool.transition('idle')
  }
}
