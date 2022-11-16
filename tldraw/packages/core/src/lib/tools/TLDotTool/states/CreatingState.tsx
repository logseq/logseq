import Vec from '@tldraw/vec'
import type { TLDotTool } from '../TLDotTool'
import { transaction } from 'mobx'
import type { TLEventMap, TLStateEvents } from '../../../../types'
import { uniqueId } from '../../../../utils'
import type { TLDotShape, TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'

export class CreatingState<
  S extends TLDotShape,
  T extends S & TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLDotTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  creatingShape?: T

  offset: number[] = [0, 0]

  onEnter = () => {
    const { Shape } = this.tool
    const shape = new Shape({
      id: uniqueId(),
      parentId: this.app.currentPage.id,
      point: Vec.sub(this.app.inputs.originPoint, this.offset),
      size: Shape.defaultProps.size,
    } as any)
    this.creatingShape = shape
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    if (!this.creatingShape) throw Error('Expected a creating shape.')
    const { currentPoint } = this.app.inputs
    this.creatingShape.update({
      point: Vec.sub(currentPoint, this.offset),
    })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.creatingShape) {
      const shape = this.creatingShape
      transaction(() => {
        this.app.currentPage.addShapes(shape)
        this.app.setSelectedShapes([shape])
      })
    }
    this.app.persist()
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        if (!this.creatingShape) throw Error('Expected a creating shape.')
        this.app.deleteShapes([this.creatingShape])
        this.tool.transition('idle')
        break
      }
    }
  }
}
