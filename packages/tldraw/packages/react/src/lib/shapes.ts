import {
  TLBoxShape,
  TLDotShape,
  TLDrawShape,
  TLEllipseShape,
  TLLineShape,
  TLPolygonShape,
  TLPolylineShape,
  TLStarShape,
  TLBoxShapeProps,
  TLDotShapeProps,
  TLDrawShapeProps,
  TLEllipseShapeProps,
  TLLineShapeProps,
  TLPolygonShapeProps,
  TLPolylineShapeProps,
  TLStarShapeProps,
} from '@tldraw/core'

import type { TLComponentProps, TLIndicatorProps } from './TLReactShape'

export abstract class TLReactBoxShape<P extends TLBoxShapeProps, M = any> extends TLBoxShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactDotShape<P extends TLDotShapeProps, M = any> extends TLDotShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactDrawShape<P extends TLDrawShapeProps, M = any> extends TLDrawShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactEllipseShape<
  P extends TLEllipseShapeProps,
  M = any
> extends TLEllipseShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactLineShape<P extends TLLineShapeProps, M = any> extends TLLineShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactPolygonShape<
  P extends TLPolygonShapeProps,
  M = any
> extends TLPolygonShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactPolylineShape<
  P extends TLPolylineShapeProps,
  M = any
> extends TLPolylineShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}

export abstract class TLReactStarShape<P extends TLStarShapeProps, M = any> extends TLStarShape<P> {
  abstract ReactComponent: (props: TLComponentProps<M>) => JSX.Element | null
  abstract ReactIndicator: (props: TLIndicatorProps<M>) => JSX.Element | null
}
