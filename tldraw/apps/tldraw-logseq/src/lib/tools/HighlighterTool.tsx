import { TLDrawTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { HighlighterShape, type Shape } from '../shapes'

export class HighlighterTool extends TLDrawTool<HighlighterShape, Shape, TLReactEventMap> {
  static id = 'highlighter'
  static shortcut = ['3', 'h']
  Shape = HighlighterShape
  simplify = true
  simplifyTolerance = 0.618
}
