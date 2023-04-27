/* eslint-disable @typescript-eslint/no-explicit-any */
import { observable, makeObservable, action } from 'mobx'

export interface TLSettingsProps {
  mode: 'light' | 'dark'
  showGrid: boolean
  color: string
  scaleLevel: string
}

export class TLSettings implements TLSettingsProps {
  constructor() {
    makeObservable(this)
  }

  @observable mode: 'dark' | 'light' = 'light'
  @observable showGrid = true
  @observable scaleLevel = 'md'
  @observable color = ''

  @action update(props: Partial<TLSettingsProps>): void {
    Object.assign(this, props)
  }
}
