import { TLApp, TLBoxShape, TLShape, TLTool } from '~lib'
import { TLCursor, TLEventMap } from '~types'
import { CreatingState, IdleState } from './states'

export abstract class TLDotTool<
  T extends TLBoxShape = TLBoxShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'box'

  static states = [IdleState, CreatingState]

  static initial = 'idle'

  cursor = TLCursor.Cross

  abstract Shape: {
    new (props: Partial<T['props']>): T
    id: string
    smart: boolean
    defaultProps: T['props']
  }
}
