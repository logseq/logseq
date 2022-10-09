import { action, computed, makeObservable, observable, transaction } from 'mobx'
import type { TLEventMap } from '../types'
import { deepCopy, deepEqual, omit } from '../utils'
import type { TLShape } from './shapes'
import type { TLApp, TLDocumentModel } from './TLApp'
import { TLPage } from './TLPage'

const shouldPersist = (a: TLDocumentModel, b: TLDocumentModel) => {
  const page0 = omit(a.pages[0], 'nonce')
  const page1 = omit(b.pages[0], 'nonce')
  return !deepEqual(page0, page1)
}

export class TLHistory<S extends TLShape = TLShape, K extends TLEventMap = TLEventMap> {
  constructor(app: TLApp<S, K>) {
    this.app = app
    makeObservable(this)
  }

  app: TLApp<S, K>
  @observable stack: TLDocumentModel[] = []
  @observable pointer = 0
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

  @action reset = () => {
    this.stack = [this.app.serialized]
    this.pointer = 0
    this.resume()

    this.app.notify('persist', null)
  }

  @action persist = (replace = false) => {
    if (this.isPaused || this.creating) return

    const { serialized } = this.app

    // Do not persist if the serialized state is the same as the last one
    if (this.stack.length > 0 && !shouldPersist(this.stack[this.pointer], serialized)) {
      return
    }

    if (replace) {
      this.stack[this.pointer] = serialized
    } else {
      if (this.pointer < this.stack.length) {
        this.stack = this.stack.slice(0, this.pointer + 1)
      }
      this.stack.push(serialized)
      this.pointer = this.stack.length - 1
    }

    this.app.pages.forEach(page => page.bump()) // Is it ok here?
    this.app.notify('persist', null)
  }

  @action setPointer = (pointer: number) => {
    this.pointer = pointer
    const snapshot = this.stack[this.pointer]
    this.deserialize(snapshot)
    this.app.notify('persist', null)
  }

  @action undo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return
    if (this.canUndo) {
      this.setPointer(this.pointer - 1)
    }
  }

  @action redo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return
    if (this.canRedo) {
      this.setPointer(this.pointer + 1)
    }
  }

  @action deserialize = (snapshot: TLDocumentModel) => {
    transaction(() => {
      const { pages } = snapshot
      const wasPaused = this.isPaused
      this.pause()

      const newSelectedIds = [...this.app.selectedIds]

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
                const newShape = new ShapeClass(serializedShape)
                shapesToAdd.push(newShape)
              }
            }

            // Do not remove shapes if currently state is creating or editing
            // Any shapes remaining in the shapes map need to be removed
            if (shapesMap.size > 0 && !this.app.selectedTool.isInAny('creating', 'editingShape')) {
              page.removeShapes(...shapesMap.values())
            }
            // Add any new shapes
            if (shapesToAdd.length > 0) page.addShapes(...shapesToAdd)
            // Remove the page from the map
            pagesMap.delete(serializedPage.id)
            page.updateBindings(serializedPage.bindings)
            page.nonce = serializedPage.nonce ?? 0
          } else {
            // Create the page
            const { id, name, shapes, bindings, nonce } = serializedPage
            pagesToAdd.push(
              new TLPage(this.app, {
                id,
                name,
                nonce,
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
    })
  }
}
