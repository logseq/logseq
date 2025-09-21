import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { BoxShape, type Shape } from '../shapes'

export class BoxTool extends TLBoxTool<BoxShape, Shape, TLReactEventMap> {
  static id = 'box'
  static shortcut = 'whiteboard/rectangle'
  Shape = BoxShape
}
