import { TLApp, TLTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { LogseqPortalShape, Shape } from '~lib/shapes'
import { CreatingState, IdleState } from './states'

export class LogseqPortalTool extends TLTool<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>
> {
  static id = 'logseq-portal'
  static shortcut = ['i']
  static states = [IdleState, CreatingState]
  static initial = 'idle'

  Shape = LogseqPortalShape
}
