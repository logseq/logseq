import { toJS } from 'mobx'
import type { TLApp, TLLineShape, TLShape } from '~lib'
import { TLBaseLineBindingState } from '~lib/TLBaseLineBindingState'
import type { TLEventMap } from '~types'
import { PointUtils, uniqueId } from '~utils'
import type { TLLineTool } from '../TLLineTool'

export class CreatingState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLLineTool<T, S, K, R>
> extends TLBaseLineBindingState<S, T, K, R, P> {
  static id = 'creating'

  onEnter = () => {
    this.app.history.pause()
    this.newStartBindingId = uniqueId()
    this.draggedBindingId = uniqueId()

    const page = this.app.currentPage
    this.bindableShapeIds = page.getBindableShapes()

    const { Shape } = this.tool
    const { originPoint } = this.app.inputs

    const shape = new Shape({
      ...Shape.defaultProps,
      id: uniqueId(),
      type: Shape.id,
      parentId: this.app.currentPage.id,
      point: originPoint,
    })
    this.initialShape = toJS(shape.props)
    this.currentShape = shape
    this.app.currentPage.addShapes(shape)
    this.app.setSelectedShapes([shape])

    this.startBindingShapeId = this.bindableShapeIds
      .map(id => this.app.getShapeById(id))
      .filter(s => PointUtils.pointInBounds(originPoint, s.bounds))[0]?.id

    if (this.startBindingShapeId) {
      this.bindableShapeIds.splice(this.bindableShapeIds.indexOf(this.startBindingShapeId), 1)
      this.app.setBindingShapes([this.startBindingShapeId])
    }
  }
}
