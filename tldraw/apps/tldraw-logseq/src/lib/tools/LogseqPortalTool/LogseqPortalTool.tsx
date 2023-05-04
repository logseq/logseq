import { TLApp, TLEvents, TLTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { type Shape, LogseqPortalShape } from '../../shapes'
import { CreatingState, IdleState } from './states'

export class LogseqPortalTool extends TLTool<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>
> {
  static id = 'logseq-portal'
  static shortcut = 'whiteboard/portal'
  static states = [IdleState, CreatingState]
  static initial = 'idle'

  Shape = LogseqPortalShape

  onPinch: TLEvents<Shape>['pinch'] = info => {
    this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2])
  }
}
