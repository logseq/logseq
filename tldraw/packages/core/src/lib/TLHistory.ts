import { action, makeObservable, observable, transaction } from 'mobx'
import type { TLEventMap } from '../types'
import type { TLShape, TLShapeModel } from './shapes'
import type { TLApp, TLDocumentModel } from './TLApp'
import { TLPage } from './TLPage'

export class TLHistory<S extends TLShape = TLShape, K extends TLEventMap = TLEventMap> {
  constructor(app: TLApp<S, K>) {
    this.app = app
    makeObservable(this)
  }

  app: TLApp<S, K>
  @observable stack: TLDocumentModel[] = []
  isPaused = true

  get creating() {
    return this.app.selectedTool.currentState.id === 'creating'
  }

  pause = () => {
    if (this.isPaused) return
    this.isPaused = true
  }

  resume = () => {
    if (!this.isPaused) return
    this.isPaused = false
  }

  @action persist = (replace = false) => {
    if (this.isPaused || this.creating) return
    this.app.notify('persist', { replace })
  }

  @action undo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return

    if (this.app.appUndo) {
      this.app.appUndo()
    }
  }

  @action redo = () => {
    if (this.isPaused) return
    if (this.app.selectedTool.currentState.id !== 'idle') return
    if (this.app.appRedo) {
      this.app.appRedo()
    }
  }

  instantiateShape = (serializedShape: TLShapeModel) => {
    const ShapeClass = this.app.getShapeClass(serializedShape.type)
    return new ShapeClass(serializedShape)
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
                shapesToAdd.push(this.instantiateShape(serializedShape))
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
                  return this.instantiateShape(serializedShape)
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
