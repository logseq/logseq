import type { TLLineTool } from '../TLLineTool'
import { TLShape, TLApp, TLToolState, TLLineShape } from '~lib'
import type { TLEventMap, TLStateEvents } from '~types'
import Vec from '@tldraw/vec'
import { uniqueId } from '~utils'
import { toJS } from 'mobx'

export class CreatingState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLLineTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  creatingShape = {} as T
  initialShape = {} as T['props']

  onEnter = () => {
    const { Shape } = this.tool
    const shape = new Shape({
      id: uniqueId(),
      type: Shape.id,
      parentId: this.app.currentPage.id,
      point: this.app.inputs.originPoint,
      handles: [{ point: [0, 0] }, { point: [1, 1] }],
    })
    this.initialShape = toJS(shape.props)
    this.creatingShape = shape
    this.app.currentPage.addShapes(shape)
    this.app.setSelectedShapes([shape])
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const {
      inputs: { shiftKey, previousPoint, originPoint, currentPoint },
    } = this.app
    if (Vec.isEqual(previousPoint, currentPoint)) return
    const delta = Vec.sub(currentPoint, originPoint)
    if (shiftKey) {
      if (Math.abs(delta[0]) < Math.abs(delta[1])) {
        delta[0] = 0
      } else {
        delta[1] = 0
      }
    }
    const { initialShape } = this
    this.creatingShape.onHandleChange(initialShape, { index: 1, delta })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.creatingShape) {
      this.app.setSelectedShapes([this.creatingShape])
    }
    if (!this.app.settings.isToolLocked) {
      this.app.transition('select')
    }
  }

  onWheel: TLStateEvents<S, K>['onWheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.deleteShapes([this.creatingShape])
        this.tool.transition('idle')
        break
      }
    }
  }
}
