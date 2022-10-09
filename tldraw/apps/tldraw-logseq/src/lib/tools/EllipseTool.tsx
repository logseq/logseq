import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { EllipseShape, type Shape } from '../shapes'

export class EllipseTool extends TLBoxTool<EllipseShape, Shape, TLReactEventMap> {
  static id = 'ellipse'
  Shape = EllipseShape
}
