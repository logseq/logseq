import { TLLineTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, LineShape } from '~lib'

export class LineTool extends TLLineTool<LineShape, Shape, TLReactEventMap> {
  static id = 'line'
  static shortcut = ['l']
  Shape = LineShape
}
