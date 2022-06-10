import { TLDrawTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { PencilShape, Shape } from '~lib'

export class PencilTool extends TLDrawTool<PencilShape, Shape, TLReactEventMap> {
  static id = 'pencil'
  static shortcut = ['d', 'p']
  Shape = PencilShape
  simplify = false
}
