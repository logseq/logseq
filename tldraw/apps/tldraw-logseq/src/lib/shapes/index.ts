import { BoxShape } from './BoxShape'
import { DotShape } from './DotShape'
import { EllipseShape } from './EllipseShape'
import { HighlighterShape } from './HighlighterShape'
import { ImageShape } from './ImageShape'
import { LineShape } from './LineShape'
import { PencilShape } from './PencilShape'
import { PolygonShape } from './PolygonShape'
import { TextShape } from './TextShape'
import { YouTubeShape } from './YouTubeShape'
import { LogseqPortalShape } from './LogseqPortalShape'
import type { TLReactShapeConstructor } from '@tldraw/react'

export type Shape =
  | BoxShape
  | DotShape
  | EllipseShape
  | HighlighterShape
  | ImageShape
  | LineShape
  | LineShape
  | PencilShape
  | PolygonShape
  | TextShape
  | YouTubeShape
  | LogseqPortalShape

export * from './BoxShape'
export * from './DotShape'
export * from './EllipseShape'
export * from './HighlighterShape'
export * from './ImageShape'
export * from './LineShape'
export * from './PencilShape'
export * from './PolygonShape'
export * from './TextShape'
export * from './YouTubeShape'
export * from './LogseqPortalShape'

export const shapes: TLReactShapeConstructor<Shape>[] = [
  BoxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  PencilShape,
  PolygonShape,
  TextShape,
  YouTubeShape,
  LogseqPortalShape,
]