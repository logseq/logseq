import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { EllipseShape, Shape } from '~lib'

export class EllipseTool extends TLBoxTool<EllipseShape, Shape, TLReactEventMap> {
  static id = 'ellipse'
  static shortcut = ['o']
  Shape = EllipseShape
}
