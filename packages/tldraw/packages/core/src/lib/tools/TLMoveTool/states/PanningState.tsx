import Vec from '@tldraw/vec'
import { type TLEventMap, TLCursor, type TLStateEvents, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLMoveTool } from '../TLMoveTool'

export class PanningState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLMoveTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'panning'
  cursor = TLCursor.Grabbing
  originalScreenPoint: number[] = []
  originalCameraPoint: number[] = []

  prevState = 'idle'

  onEnter = (info: any) => {
    this.prevState = info?.prevState
    this.originalScreenPoint = this.app.inputs.currentScreenPoint
    this.originalCameraPoint = this.app.viewport.camera.point
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = (_, e: K['pointer']) => {
    const delta = Vec.sub(this.originalScreenPoint, this.app.inputs.currentScreenPoint)
    this.app.viewport.update({
      point: Vec.sub(this.originalCameraPoint, Vec.div(delta, this.app.viewport.camera.zoom)),
    })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition(this.prevState ?? 'idle')
  }
}
