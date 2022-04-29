import { TLDrawTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { PenShape, Shape } from '~lib'

export class PenTool extends TLDrawTool<PenShape, Shape, TLReactEventMap> {
  static id = 'pen'
  static shortcut = ['d', 'p']
  Shape = PenShape
  simplify = false
}
