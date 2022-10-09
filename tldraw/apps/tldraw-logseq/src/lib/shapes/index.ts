import type { TLReactShapeConstructor } from '@tldraw/react'
import { BoxShape } from './BoxShape'
import { DotShape } from './DotShape'
import { EllipseShape } from './EllipseShape'
import { HighlighterShape } from './HighlighterShape'
import { HTMLShape } from './HTMLShape'
import { ImageShape } from './ImageShape'
import { VideoShape } from './VideoShape'
import { IFrameShape } from './IFrameShape'
import { LineShape } from './LineShape'
import { LogseqPortalShape } from './LogseqPortalShape'
import { PencilShape } from './PencilShape'
import { PolygonShape } from './PolygonShape'
import { TextShape } from './TextShape'
import { YouTubeShape } from './YouTubeShape'
import type { PenShape } from './PenShape'

export type Shape =
  | BoxShape
  | DotShape
  | EllipseShape
  | HighlighterShape
  | ImageShape
  | VideoShape
  | LineShape
  | PenShape
  | PencilShape
  | PolygonShape
  | TextShape
  | YouTubeShape
  | IFrameShape
  | HTMLShape
  | LogseqPortalShape

export * from './BoxShape'
export * from './DotShape'
export * from './EllipseShape'
export * from './HighlighterShape'
export * from './HTMLShape'
export * from './ImageShape'
export * from './VideoShape'
export * from './IFrameShape'
export * from './LineShape'
export * from './LogseqPortalShape'
export * from './PencilShape'
export * from './PolygonShape'
export * from './TextShape'
export * from './YouTubeShape'

export const shapes: TLReactShapeConstructor<Shape>[] = [
  BoxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  VideoShape,
  LineShape,
  PencilShape,
  PolygonShape,
  TextShape,
  YouTubeShape,
  IFrameShape,
  HTMLShape,
  LogseqPortalShape,
]

export type SizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
