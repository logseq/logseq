import { IdleState, CreatingState } from './states'
import { TLTool, TLApp, TLShape, TLDotShape, TLDotShapeProps } from '~lib'
import { TLCursor, TLEventMap } from '~types'

export abstract class TLDotTool<
  T extends TLDotShape = TLDotShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'box'

  static states = [IdleState, CreatingState]

  static initial = 'idle'

  cursor = TLCursor.Cross

  abstract Shape: {
    new (props: Partial<TLDotShapeProps>): T
    id: string
    defaultProps: TLDotShapeProps
  }
}
