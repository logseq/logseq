import { TLTextTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { TextShape, type Shape } from '../shapes'

export class TextTool extends TLTextTool<TextShape, Shape, TLReactEventMap> {
  static id = 'text'
  static shortcut = ['7']
  Shape = TextShape
}
