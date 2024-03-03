import { TLEraseTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import type { Shape } from '../shapes'

export class NuEraseTool extends TLEraseTool<Shape, TLReactEventMap> {
  static id = 'erase'
  static shortcut = 'whiteboard/eraser'
}
