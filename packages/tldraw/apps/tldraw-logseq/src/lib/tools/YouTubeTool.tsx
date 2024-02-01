import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { YouTubeShape, type Shape } from '../shapes'

export class YouTubeTool extends TLBoxTool<YouTubeShape, Shape, TLReactEventMap> {
  static id = 'youtube'
  Shape = YouTubeShape
}

export {}
