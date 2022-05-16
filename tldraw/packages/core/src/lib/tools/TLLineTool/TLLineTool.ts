import { IdleState, PointingState, CreatingState } from './states'
import { TLTool, TLApp, TLShape, TLLineShape, TLLineShapeProps } from '~lib'
import { TLEventMap, TLCursor } from '~types'

// shape tools need to have two generics: a union of all shapes in
// the app, and the particular shape that they'll be creating

export abstract class TLLineTool<
  T extends TLLineShape = TLLineShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'line'

  static states = [IdleState, PointingState, CreatingState]

  static initial = 'idle'

  cursor = TLCursor.Cross

  abstract Shape: {
    new (props: Partial<TLLineShapeProps>): T
    id: string
    defaultProps: TLLineShapeProps
  }
}
