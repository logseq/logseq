import { TLLineTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { LineShape, type Shape } from '../shapes'

// @ts-expect-error maybe later
export class LineTool extends TLLineTool<LineShape, Shape, TLReactEventMap> {
  static id = 'line'
  static shortcut = ['7', 'c']
  Shape = LineShape
}
