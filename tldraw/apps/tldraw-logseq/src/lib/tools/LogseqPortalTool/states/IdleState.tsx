import { TLApp, TLStateEvents, TLToolState } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import type { Shape } from '~lib/shapes'
import type { LogseqPortalTool } from '../LogseqPortalTool'

export class IdleState extends TLToolState<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>,
  LogseqPortalTool
> {
  static id = 'idle'

  onEnter = ({ quick }: { quick: boolean } = { quick: false }) => {
    if (quick) {
      this.tool.transition('creating', { quick })
    }
  }
}
