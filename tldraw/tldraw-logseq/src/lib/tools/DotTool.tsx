import { TLDotTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, DotShape } from '~lib/shapes'

export class DotTool extends TLDotTool<DotShape, Shape, TLReactEventMap> {
  static id = 'dot'
  static shortcut = ['t']
  Shape = DotShape
}
