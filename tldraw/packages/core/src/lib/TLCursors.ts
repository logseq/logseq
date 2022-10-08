import { action, makeObservable, observable } from 'mobx'
import { TLCursor } from '../types'

export class TLCursors {
  constructor() {
    makeObservable(this)
  }

  @observable cursor = TLCursor.Default
  @observable rotation = 0

  @action reset = () => {
    this.cursor = TLCursor.Default
  }

  @action setCursor = (cursor: TLCursor, rotation = 0) => {
    if (cursor === this.cursor && rotation === this.rotation) return
    this.cursor = cursor
    this.rotation = rotation
  }

  @action setRotation = (rotation: number) => {
    if (rotation === this.rotation) return
    this.rotation = rotation
  }
}
