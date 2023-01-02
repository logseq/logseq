import { action, computed, makeObservable, observable, transaction } from 'mobx'
import type { TLEventMap } from '../types'
import { deepCopy, deepEqual, omit } from '../utils'
import type { TLShape, TLShapeModel } from './shapes'
import type { TLGroupShape } from './shapes/TLGroupShape'
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
    this.app.pages.forEach(page => page.bump()) // Is it ok here?
    this.app.notify('persist', null)
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
}
