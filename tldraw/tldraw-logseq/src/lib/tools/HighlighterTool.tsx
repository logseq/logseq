import { TLDrawTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { HighlighterShape, Shape } from '~lib'

export class HighlighterTool extends TLDrawTool<HighlighterShape, Shape, TLReactEventMap> {
  static id = 'highlighter'
  static shortcut = ['h']
  Shape = HighlighterShape
  simplify = true
  simplifyTolerance = 0.618
}
