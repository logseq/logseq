import type { TLReactEventMap } from '@tldraw/react'
import { TLBoxTool } from '@tldraw/core'
import { StarShape, Shape } from '~lib'

export class StarTool extends TLBoxTool<StarShape, Shape, TLReactEventMap> {
  static id = 'star'
  static shortcut = ['s']
  Shape = StarShape
}

export {}
