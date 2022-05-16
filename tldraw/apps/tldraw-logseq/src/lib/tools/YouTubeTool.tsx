import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, YouTubeShape } from '~lib/shapes'

export class YouTubeTool extends TLBoxTool<YouTubeShape, Shape, TLReactEventMap> {
  static id = 'youtube'
  static shortcut = ['y']
  Shape = YouTubeShape
}

export {}
