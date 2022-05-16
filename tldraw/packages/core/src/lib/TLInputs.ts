import { action, makeObservable, observable } from 'mobx'
import type { TLEventMap } from '~types'

export class TLInputs<K extends TLEventMap> {
  constructor() {
    makeObservable(this)
  }

  // note: fine for dev, but we probably don't need to make
  // any of these properties observable
  @observable shiftKey = false
  @observable ctrlKey = false
  @observable altKey = false
  @observable spaceKey = false
  @observable isPinching = false
  @observable currentScreenPoint = [0, 0]
  @observable currentPoint = [0, 0]
  @observable previousScreenPoint = [0, 0]
  @observable previousPoint = [0, 0]
  @observable originScreenPoint = [0, 0]
  @observable originPoint = [0, 0]
  pointerIds = new Set<number>()

  @observable state: 'pointing' | 'pinching' | 'idle' = 'idle'

  @action private updateModifiers(
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['wheel'] | K['touch']
  ) {
    if ('clientX' in event) {
      this.previousScreenPoint = this.currentScreenPoint
      this.currentScreenPoint = [event.clientX, event.clientY]
    }
    if ('shiftKey' in event) {
      this.shiftKey = event.shiftKey
      this.ctrlKey = event.metaKey || event.ctrlKey
      this.altKey = event.altKey
    }
  }

  @action onWheel = (pagePoint: number[], event: K['wheel']) => {
    // if (this.state === 'pinching') return
    this.updateModifiers(event)
    this.previousPoint = this.currentPoint
    this.currentPoint = pagePoint
  }

  @action onPointerDown = (pagePoint: number[], event: K['pointer']) => {
    // if (this.pointerIds.size > 0) return
    this.pointerIds.add(event.pointerId)
    this.updateModifiers(event)
    this.originScreenPoint = this.currentScreenPoint
    this.originPoint = pagePoint
    this.state = 'pointing'
  }

  @action onPointerMove = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['wheel'] | K['touch']
  ) => {
    if (this.state === 'pinching') return
    // if ('pointerId' in event && !this.pointerIds.has(event.pointerId)) return
    this.updateModifiers(event)
    this.previousPoint = this.currentPoint
    this.currentPoint = pagePoint
  }

  @action onPointerUp = (pagePoint: number[], event: K['pointer']) => {
    // if (!this.pointerIds.has(event.pointerId)) return
    this.pointerIds.clear()
    this.updateModifiers(event)
    this.state = 'idle'
  }

  @action onKeyDown = (event: K['keyboard']) => {
    this.updateModifiers(event)
    switch (event.key) {
      case ' ': {
        this.spaceKey = true
        break
      }
    }
  }

  @action onKeyUp = (event: K['keyboard']) => {
    this.updateModifiers(event)
    switch (event.key) {
      case ' ': {
        this.spaceKey = false
        break
      }
    }
  }

  @action onPinchStart = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['wheel'] | K['touch']
  ) => {
    this.updateModifiers(event)
    this.state = 'pinching'
  }

  @action onPinch = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['wheel'] | K['touch']
  ) => {
    if (this.state !== 'pinching') return
    this.updateModifiers(event)
  }

  @action onPinchEnd = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['wheel'] | K['touch']
  ) => {
    if (this.state !== 'pinching') return
    this.updateModifiers(event)
    this.state = 'idle'
  }
}
