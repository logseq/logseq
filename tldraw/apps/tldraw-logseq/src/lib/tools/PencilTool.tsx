import { TLDrawTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { PencilShape, type Shape } from '../shapes'

export class PencilTool extends TLDrawTool<PencilShape, Shape, TLReactEventMap> {
  static id = 'pencil'
  static shortcut = ['3']
  Shape = PencilShape
  simplify = false
}
