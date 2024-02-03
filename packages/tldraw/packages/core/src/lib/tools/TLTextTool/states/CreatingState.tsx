import type { TLTextTool } from '../TLTextTool'
import Vec from '@tldraw/vec'
import { GRID_SIZE } from '@tldraw/core'
import type { TLBounds } from '@tldraw/intersect'
import { transaction } from 'mobx'
import { type TLEventMap, TLCursor, TLTargetType } from '../../../../types'
import { uniqueId } from '../../../../utils'
import type { TLTextShape, TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'

export class CreatingState<
  T extends TLTextShape,
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLTextTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  cursor = TLCursor.Cross
  creatingShape?: T
  aspectRatio?: number
  initialBounds = {} as TLBounds

  onEnter = () => {
    const {
      currentPage,
      inputs: { originPoint },
    } = this.app
    const { Shape } = this.tool
    const shape = new Shape({
      id: uniqueId(),
      type: Shape.id,
      parentId: currentPage.id,
      point: [...originPoint],
      text: '',
      size: [16, 32],
      isSizeLocked: true,
      fill: this.app.settings.color,
      stroke: this.app.settings.color,
    })
    this.creatingShape = shape
    this.creatingShape.setScaleLevel(this.app.settings.scaleLevel)
    transaction(() => {
      this.app.currentPage.addShapes(shape as unknown as S)
      const point = this.app.settings.snapToGrid ? Vec.snap([...originPoint], GRID_SIZE) : originPoint
      const { bounds } = shape
      shape.update({
        point: Vec.sub(point, [bounds.width / 2, bounds.height / 2]) })
      this.app.transition('select')
      this.app.setSelectedShapes([shape as unknown as S])
      this.app.currentState.transition('editingShape', {
        type: TLTargetType.Shape,
        shape: this.creatingShape,
        order: 0,
      })
    })
  }
}
