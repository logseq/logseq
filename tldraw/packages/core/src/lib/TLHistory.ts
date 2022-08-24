import { computed, makeObservable } from 'mobx'
import { TLApp, TLDocumentModel, TLPage, TLShape } from '~lib'
import type { TLEventMap } from '~types'
import { deepEqual } from '~utils'

export class TLHistory<S extends TLShape = TLShape, K extends TLEventMap = TLEventMap> {
  constructor(app: TLApp<S, K>) {
    this.app = app
    makeObservable(this)
  }

  app: TLApp<S, K>
  stack: TLDocumentModel[] = []
  pointer = 0
  isPaused = true

  get creating() {
    return this.app.selectedTool.currentState.id === 'creating'
  }

  @computed
  get canUndo() {
    return this.pointer > 0
  }

  @computed
  get canRedo() {
    return this.pointer < this.stack.length - 1
  }

  pause = () => {
    if (this.isPaused) return
    this.isPaused = true
  }

  resume = () => {
    if (!this.isPaused) return
    this.isPaused = false
  }

  reset = () => {
    this.stack = [this.app.serialized]
    this.pointer = 0
    this.resume()

    this.app.notify('persist', null)
  }

  persist = (replace = false) => {
    if (this.isPaused || this.creating) return

    const { serialized } = this.app

    // Do not persist if the serialized state is the same as the last one
    if (deepEqual(this.stack[this.pointer], serialized)) return

    if (replace) {
      this.stack[this.pointer] = serialized
    } else {
      if (this.pointer < this.stack.length) {
        this.stack = this.stack.slice(0, this.pointer + 1)
      }

      this.stack.push(serialized)
      this.pointer = this.stack.length - 1
    }

    this.app.notify('persist', null)
  }

  undo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return
    if (this.canUndo) {
      this.pointer--
      const snapshot = this.stack[this.pointer]
      this.deserialize(snapshot)
      this.app.notify('persist', null)
    }
  }

  redo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return
    if (this.canRedo) {
      this.pointer++
      const snapshot = this.stack[this.pointer]
      this.deserialize(snapshot)
      this.app.notify('persist', null)
    }
  }

  deserialize = (snapshot: TLDocumentModel) => {
    const { currentPageId, selectedIds, pages } = snapshot
    const wasPaused = this.isPaused
    this.pause()

    const newSelectedIds = selectedIds.length === 0 ? Array.from(this.app.selectedIds) : selectedIds

    try {
      const pagesMap = new Map(this.app.pages)
      const pagesToAdd: TLPage<S, K>[] = []

      for (const serializedPage of pages) {
        const page = pagesMap.get(serializedPage.id)
        if (page !== undefined) {
          // Update the page
          const shapesMap = new Map(page.shapes.map(shape => [shape.props.id, shape]))
          const shapesToAdd: S[] = []
          for (const serializedShape of serializedPage.shapes) {
            const shape = shapesMap.get(serializedShape.id)
            if (shape !== undefined) {
              // Update the shape
              if (shape.nonce !== serializedShape.nonce) {
                shape.update(serializedShape, true)
                shape.nonce = serializedShape.nonce!
                shape.setLastSerialized(serializedShape)
              }
              shapesMap.delete(serializedShape.id)
            } else {
              // Create the shape
              const ShapeClass = this.app.getShapeClass(serializedShape.type)
              shapesToAdd.push(new ShapeClass(serializedShape))
            }
          }

          // Do not remove any currently selected shapes
          newSelectedIds.forEach(id => {
            shapesMap.delete(id)
          })

          // Any shapes remaining in the shapes map need to be removed
          if (shapesMap.size > 0) {
            page.removeShapes(...shapesMap.values())
          }
          // Add any new shapes
          if (shapesToAdd.length > 0) page.addShapes(...shapesToAdd)
          // Remove the page from the map
          pagesMap.delete(serializedPage.id)
          page.updateBindings(serializedPage.bindings)
        } else {
          // Create the page
          const { id, name, shapes, bindings } = serializedPage
          pagesToAdd.push(
            new TLPage(this.app, {
              id,
              name,
              bindings,
              shapes: shapes.map(serializedShape => {
                const ShapeClass = this.app.getShapeClass(serializedShape.type)
                return new ShapeClass(serializedShape)
              }),
            })
          )
        }
      }

      // Add any new pages
      if (pagesToAdd.length > 0) this.app.addPages(pagesToAdd)

      // Any pages remaining in the pages map need to be removed
      if (pagesMap.size > 0) this.app.removePages(Array.from(pagesMap.values()))

      this.app.setSelectedShapes(newSelectedIds).setErasingShapes([])
    } catch (e) {
      console.warn(e)
    }

    // Resume the history if not originally paused
    if (!wasPaused) this.resume()
  }
}
