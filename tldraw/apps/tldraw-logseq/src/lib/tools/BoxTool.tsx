import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, BoxShape } from '~lib'

export class BoxTool extends TLBoxTool<BoxShape, Shape, TLReactEventMap> {
  static id = 'box'
  static shortcut = ['r']
  Shape = BoxShape
}
