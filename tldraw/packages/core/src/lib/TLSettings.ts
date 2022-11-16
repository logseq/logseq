/* eslint-disable @typescript-eslint/no-explicit-any */
import { observable, makeObservable, action } from 'mobx'

export interface TLSettingsProps {
  mode: 'light' | 'dark'
  showGrid: boolean
  color: string
  opacity: number
}

export class TLSettings implements TLSettingsProps {
  constructor() {
    makeObservable(this)
  }

  @observable mode: 'dark' | 'light' = 'light'
  @observable showGrid = true
  @observable color = ''
  @observable opacity = 1

  @action update(props: Partial<TLSettingsProps>): void {
    Object.assign(this, props)
  }
}
