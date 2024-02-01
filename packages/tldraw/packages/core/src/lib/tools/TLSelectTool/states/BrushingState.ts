import type { TLEventMap, TLEvents } from '../../../../types'
import { BoundsUtils, dedupe } from '../../../../utils'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLBush } from '../../../TLBush'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class BrushingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'brushing'

  private initialSelectedIds: string[] = []

  private initialSelectedShapes: S[] = []

  private tree: TLBush<S> = new TLBush()

  onEnter = () => {
    const { selectedShapes, currentPage, selectedIds } = this.app
    this.initialSelectedIds = Array.from(selectedIds.values())
    this.initialSelectedShapes = Array.from(selectedShapes.values())
    this.tree.load(currentPage.shapes)
  }

  onExit = () => {
    this.initialSelectedIds = []
    this.tree.clear()
    this.app.setBrush(undefined)
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const {
      inputs: { shiftKey, ctrlKey, originPoint, currentPoint },
    } = this.app

    const brushBounds = BoundsUtils.getBoundsFromPoints([currentPoint, originPoint], 0)

    this.app.setBrush(brushBounds)

    const hits = dedupe(
      this.tree
        .search(brushBounds)
        .filter(shape =>
          ctrlKey
            ? BoundsUtils.boundsContain(brushBounds, shape.rotatedBounds)
            : shape.hitTestBounds(brushBounds)
        )
        .filter(shape => shape.type !== 'group')
        .map(shape => {
          // for a shape in a group, select the group instead
          return this.app.getParentGroup(shape) ?? shape
        })
    )

    if (shiftKey) {
      if (hits.every(hit => this.initialSelectedShapes.includes(hit))) {
        // Deselect hit shapes
        this.app.setSelectedShapes(this.initialSelectedShapes.filter(hit => !hits.includes(hit)))
      } else {
        // Select hit shapes + initial selected shapes
        this.app.setSelectedShapes(dedupe([...this.initialSelectedShapes, ...hits]))
      }
    } else {
      // Select hit shapes
      this.app.setSelectedShapes(hits)
    }
    this.app.viewport.panToPointWhenNearBounds(currentPoint)
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.setBrush(undefined)
    this.tool.transition('idle')
  }

  handleModifierKey: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.setBrush(undefined)
        this.app.setSelectedShapes(this.initialSelectedIds)
        this.tool.transition('idle')
        break
      }
    }
  }
}
