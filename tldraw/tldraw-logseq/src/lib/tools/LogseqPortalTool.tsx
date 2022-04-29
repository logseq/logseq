import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, LogseqPortalShape } from '~lib/shapes'

export class LogseqPortalTool extends TLBoxTool<LogseqPortalShape, Shape, TLReactEventMap> {
  static id = 'logseq-portal'
  static shortcut = ['i']
  Shape = LogseqPortalShape
}

export {}
