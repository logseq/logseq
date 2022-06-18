import { TLLineTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, LineShape } from '~lib'

// @ts-expect-error maybe later
export class LineTool extends TLLineTool<LineShape, Shape, TLReactEventMap> {
  static id = 'line'
  // not sure why "c" is not working in Logseq?
  static shortcut = ['c', 'x']
  Shape = LineShape
}
