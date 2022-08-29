import RBush from 'rbush'
import type { TLShape } from './shapes'

export class TLBush<S extends TLShape = TLShape> extends RBush<S> {
  toBBox = (shape: S) => shape.rotatedBounds
}
