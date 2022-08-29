import { TLApp, TLEvents, TLTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { type Shape, LogseqPortalShape } from '../../shapes'
import { CreatingState, IdleState } from './states'

export class LogseqPortalTool extends TLTool<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>
> {
  static id = 'logseq-portal'
  static shortcut = ['l']
  static states = [IdleState, CreatingState]
  static initial = 'idle'

  Shape = LogseqPortalShape

  private pinchCamera(point: number[], delta: number[], zoom: number) {
    const { camera } = this.app.viewport
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
    const p1 = Vec.sub(Vec.div(point, zoom), nextPoint)
    this.app.setCamera(Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom)
  }

  onPinch: TLEvents<Shape>['pinch'] = info => {
    this.pinchCamera(info.point, [0, 0], info.offset[0])
  }
}
