import { TLApp, TLCursor, TLToolState } from '@tldraw/core'
import type { TLReactEventMap, TLReactEvents } from '@tldraw/react'
import type { Shape } from '~lib/shapes'
import type { LogseqPortalTool } from '../LogseqPortalTool'

export class IdleState extends TLToolState<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>,
  LogseqPortalTool
> {
  static id = 'idle'
  cursor = TLCursor.Cross

  onEnter = ({ quick }: { quick?: boolean }) => {
    if (quick) {
      this.tool.transition('creating')
    }
  }

  onPointerDown: TLReactEvents<Shape>['pointer'] = e => {
    this.tool.transition('creating')
  }
}
