import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { IFrameShape, type Shape } from '../shapes'

export class IFrameTool extends TLBoxTool<IFrameShape, Shape, TLReactEventMap> {
  static id = 'iframe'
  Shape = IFrameShape
}

export {}
