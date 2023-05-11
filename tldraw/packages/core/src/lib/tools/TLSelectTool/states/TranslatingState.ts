import { Vec } from '@tldraw/vec'
import { transaction } from 'mobx'
import { type TLEventMap, TLCursor, type TLEvents } from '../../../../types'
import { dedupe, uniqueId } from '../../../../utils'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class TranslatingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'translating'
  cursor = TLCursor.Move

  private isCloning = false

  private didClone = false

  private initialPoints: Record<string, number[]> = {}

  private initialShapePoints: Record<string, number[]> = {}

  private initialClonePoints: Record<string, number[]> = {}

  private clones: S[] = []

  private moveSelectedShapesToPointer() {
    const {
      inputs: { shiftKey, originPoint, currentPoint },
    } = this.app

    const { initialPoints } = this

    const delta = Vec.sub(currentPoint, originPoint)

    if (shiftKey) {
      if (Math.abs(delta[0]) < Math.abs(delta[1])) {
        delta[0] = 0
      } else {
        delta[1] = 0
      }
    }

    transaction(() => {
      this.app.allSelectedShapesArray.forEach(shape => {
        if (!shape.props.isLocked) shape.update({ point: Vec.add(initialPoints[shape.id], delta) })
      })
    })
  }

  private startCloning() {
    // FIXME: clone group?
    if (!this.didClone) {
      // Create the clones
      this.clones = this.app.allSelectedShapesArray.map(shape => {
        const ShapeClass = this.app.getShapeClass(shape.type)
        if (!ShapeClass) throw Error('Could not find that shape class.')
        const clone = new ShapeClass({
          ...shape.serialized,
          id: uniqueId(),
          type: shape.type,
          point: this.initialPoints[shape.id],
          rotation: shape.props.rotation,
          isLocked: false,
        })
        return clone
      })

      this.initialClonePoints = Object.fromEntries(
        this.clones.map(({ id, props: { point } }) => [id, point.slice()])
      )

      this.didClone = true
    }

    // Move shapes back to their start positions
    this.app.allSelectedShapes.forEach(shape => {
      shape.update({ point: this.initialPoints[shape.id] })
    })

    // Set the initial points to the original clone points
    this.initialPoints = this.initialClonePoints

    // Add the clones to the page
    this.app.currentPage.addShapes(...this.clones)

    // Select the clones
    this.app.setSelectedShapes(Object.keys(this.initialClonePoints))

    // Move the clones to the pointer
    this.moveSelectedShapesToPointer()

    this.isCloning = true
  }

  onEnter = () => {
    // Pause the history when we enter
    this.app.history.pause()

    // Set initial data
    const { allSelectedShapesArray, inputs } = this.app

    this.initialShapePoints = Object.fromEntries(
      allSelectedShapesArray.map(({ id, props: { point } }) => [id, point.slice()])
    )
    this.initialPoints = this.initialShapePoints

    // Blur all inputs when moving shapes
    document.querySelectorAll<HTMLElement>('input,textarea').forEach(el => el.blur())

    // Clear selection
    document.getSelection()?.empty()

    if (inputs.altKey) {
      this.startCloning()
    } else {
      this.moveSelectedShapesToPointer()
    }
  }

  onExit = () => {
    // Resume the history when we exit
    this.app.history.resume()
    this.app.persist()

    // Reset initial data
    this.didClone = false
    this.isCloning = false
    this.clones = []
    this.initialPoints = {}
    this.initialShapePoints = {}
    this.initialClonePoints = {}
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const {
      inputs: { currentPoint },
    } = this.app

    this.moveSelectedShapesToPointer()
    this.app.viewport.panToPointWhenOutOfBounds(currentPoint)
  }

  onPointerDown: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Alt': {
        this.startCloning()
        break
      }
      case 'Escape': {
        this.app.allSelectedShapes.forEach(shape => {
          shape.update({ point: this.initialPoints[shape.id] })
        })
        this.tool.transition('idle')
        break
      }
    }
  }

  onKeyUp: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Alt': {
        if (!this.isCloning) throw Error('Expected to be cloning.')

        const { currentPage, allSelectedShapes } = this.app

        // Remove the selected shapes (our clones)
        currentPage.removeShapes(...allSelectedShapes)

        // Set the initial points to the original shape points
        this.initialPoints = this.initialShapePoints

        // Select the original shapes again
        this.app.setSelectedShapes(Object.keys(this.initialPoints))

        // Move the original shapes to the pointer
        this.moveSelectedShapesToPointer()

        this.isCloning = false
        break
      }
    }
  }
}
