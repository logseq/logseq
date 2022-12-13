import type { TLBounds } from '@tldraw/intersect'
import { computed, makeObservable } from 'mobx'
import { BoundsUtils } from '../../../utils'
import { TLBoxShape, TLBoxShapeProps } from '../TLBoxShape'
import type { TLShape } from '../TLShape'

export interface TLGroupShapeProps extends TLBoxShapeProps {
  children: string[] // shape ids
}

export class TLGroupShape<
  P extends TLGroupShapeProps = TLGroupShapeProps,
  M = any
> extends TLBoxShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
    this.canResize = [false, false]
  }

  canEdit = false
  canFlip = false

  static id = 'group'

  static defaultProps: TLGroupShapeProps = {
    id: 'group',
    type: 'group',
    parentId: 'page',
    point: [0, 0],
    size: [0, 0],
    children: [],
  }

  getShapes(): TLShape[] {
    throw new Error('will be implemented other places')
  }

  @computed get shapes() {
    return this.getShapes()
  }

  getBounds = (): TLBounds => {
    return BoundsUtils.getCommonBounds(this.shapes.map(s => s.getBounds()))
  }
}
