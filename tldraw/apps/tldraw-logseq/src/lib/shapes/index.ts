import type { TLReactShapeConstructor } from '@tldraw/react'
import { BoxShape } from './BoxShape'
import { EllipseShape } from './EllipseShape'
import { GroupShape } from './GroupShape'
import { HighlighterShape } from './HighlighterShape'
import { HTMLShape } from './HTMLShape'
import { IFrameShape } from './IFrameShape'
import { ImageShape } from './ImageShape'
import { LineShape } from './LineShape'
import { LogseqPortalShape } from './LogseqPortalShape'
import { PencilShape } from './PencilShape'
import { PolygonShape } from './PolygonShape'
import { TextShape } from './TextShape'
import { VideoShape } from './VideoShape'
import { YouTubeShape } from './YouTubeShape'

export type Shape =
  // | PenShape
  // | DotShape
  | BoxShape
  | EllipseShape
  | HighlighterShape
  | ImageShape
  | VideoShape
  | LineShape
  | PencilShape
  | PolygonShape
  | TextShape
  | YouTubeShape
  | IFrameShape
  | HTMLShape
  | LogseqPortalShape
  | GroupShape

export * from './BoxShape'
export * from './DotShape'
export * from './EllipseShape'
export * from './HighlighterShape'
export * from './HTMLShape'
export * from './IFrameShape'
export * from './ImageShape'
export * from './LineShape'
export * from './LogseqPortalShape'
export * from './PencilShape'
export * from './PolygonShape'
export * from './TextShape'
export * from './VideoShape'
export * from './YouTubeShape'

export const shapes: TLReactShapeConstructor<Shape>[] = [
  // DotShape,
  BoxShape,
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
  GroupShape,
]

export type SizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
