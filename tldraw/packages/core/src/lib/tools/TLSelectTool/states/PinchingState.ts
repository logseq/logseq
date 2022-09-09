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
  event: K['wheel'] | K['pointer'] | K['touch'] | K['keyboard'] | K['gesture']
}

export class PinchingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pinching'

  onPinch: TLEvents<S>['pinch'] = (info, event: any) => {
    const { camera } = this.app.viewport

    // Normalize the value of deltaZ from raw WheelEvent
    const deltaZ = normalizeWheel(event)[2] * 0.01
    if (deltaZ === 0) return
    const zoom = camera.zoom - deltaZ * camera.zoom
    this.app.viewport.pinchCamera(info.point, [0, 0], zoom)
  }

  onPinchEnd: TLEvents<S>['pinch'] = () => {
    this.tool.transition('idle')
  }

  onPointerDown: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }
}

// Adapted from https://stackoverflow.com/a/13650579
function normalizeWheel(event: WheelEvent) {
  const MAX_ZOOM_STEP = 10
  const { deltaY, deltaX } = event

  let deltaZ = 0

  if (event.ctrlKey || event.metaKey) {
    const signY = Math.sign(event.deltaY)
    const absDeltaY = Math.abs(event.deltaY)

    let dy = deltaY

    if (absDeltaY > MAX_ZOOM_STEP) {
      dy = MAX_ZOOM_STEP * signY
    }

    deltaZ = dy
  }

  return [deltaX, deltaY, deltaZ]
}
