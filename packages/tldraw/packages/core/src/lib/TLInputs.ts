import Vec from '@tldraw/vec'
import { action, makeObservable, observable } from 'mobx'
import type { TLEventMap } from '../types'
import { modKey } from '../utils'

export class TLInputs<K extends TLEventMap> {
  constructor() {
    makeObservable(this)
  }

  // note: fine for dev, but we probably don't need to make
  // any of these properties observable
  @observable shiftKey = false
  @observable ctrlKey = false
  @observable modKey = false
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

  @observable state: 'pointing' | 'pinching' | 'idle' | 'panning' = 'idle'

  // The canvas container offset
  @observable containerOffset: [number, number] = [0, 0]

  @action updateContainerOffset(containerOffset: [number, number]) {
    Object.assign(this.containerOffset, containerOffset)
  }

  @action private updateModifiers(event: K['gesture'] | K['pointer'] | K['keyboard'] | K['touch']) {
    if (!event.isPrimary) {
      return
    }
    if ('clientX' in event) {
      this.previousScreenPoint = this.currentScreenPoint
      this.currentScreenPoint = Vec.sub([event.clientX, event.clientY], this.containerOffset)
    }
    if ('shiftKey' in event) {
      this.shiftKey = event.shiftKey
      this.ctrlKey = event.ctrlKey
      this.altKey = event.altKey
      this.modKey = modKey(event)
    }
  }

  @action onPointerDown = (pagePoint: number[], event: K['pointer']) => {
    this.pointerIds.add(event.pointerId)
    this.updateModifiers(event)
    this.originScreenPoint = this.currentScreenPoint
    this.originPoint = pagePoint
    this.state = 'pointing'
  }

  @action onPointerMove = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['touch']
  ) => {
    if (this.state === 'pinching') return
    if (this.state === 'panning') {
      this.state = 'idle'
    }
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
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['touch']
  ) => {
    this.updateModifiers(event)
    this.state = 'pinching'
  }

  @action onPinch = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['touch']
  ) => {
    if (this.state !== 'pinching') return
    this.updateModifiers(event)
  }

  @action onPinchEnd = (
    pagePoint: number[],
    event: K['gesture'] | K['pointer'] | K['keyboard'] | K['touch']
  ) => {
    if (this.state !== 'pinching') return
    this.updateModifiers(event)
    this.state = 'idle'
  }
}
