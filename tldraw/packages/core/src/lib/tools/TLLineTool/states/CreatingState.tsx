import { toJS } from 'mobx'
import type { TLEventMap } from '../../../../types'
import { uniqueId, PointUtils } from '../../../../utils'
import type { TLShape, TLLineShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLBaseLineBindingState } from '../../../TLBaseLineBindingState'
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
      fill: this.app.settings.color,
      stroke: this.app.settings.color,
      scaleLevel: this.app.settings.scaleLevel,
    })
    this.initialShape = toJS(shape.props)
    this.currentShape = shape
    this.app.currentPage.addShapes(shape)
    this.app.setSelectedShapes([shape])

    this.startBindingShapeId = this.bindableShapeIds
      .map(id => this.app.getShapeById(id)!)
      .filter(s => PointUtils.pointInBounds(originPoint, s.bounds))[0]?.id

    if (this.startBindingShapeId) {
      this.bindableShapeIds.splice(this.bindableShapeIds.indexOf(this.startBindingShapeId), 1)
      this.app.setBindingShapes([this.startBindingShapeId])
    }
  }
}
