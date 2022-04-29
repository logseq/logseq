import { TLTextTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, TextShape } from '~lib'

export class TextTool extends TLTextTool<TextShape, Shape, TLReactEventMap> {
  static id = 'text'
  static shortcut = ['t']
  Shape = TextShape
}
