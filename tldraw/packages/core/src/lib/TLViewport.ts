import { Vec } from '@tldraw/vec'
import { action, computed, makeObservable, observable } from 'mobx'
import { FIT_TO_SCREEN_PADDING, ZOOM_UPDATE_FACTOR } from '../constants'
import type { TLBounds } from '../types'

export class TLViewport {
  constructor() {
    makeObservable(this)
  }

  static readonly minZoom = 0.1
  static readonly maxZoom = 4

  /* ------------------- Properties ------------------- */

  @observable bounds: TLBounds = {
    minX: 0,
    minY: 0,
    maxX: 1080,
    maxY: 720,
    width: 1080,
    height: 720,
  }

  @observable camera = {
    point: [0, 0],
    zoom: 1,
  }

  /* --------------------- Actions -------------------- */

  @action updateBounds = (bounds: TLBounds): this => {
    this.bounds = bounds
    return this
  }

  panCamera = (delta: number[]): this => {
    return this.update({
      point: Vec.sub(this.camera.point, Vec.div(delta, this.camera.zoom)),
    })
  }

  @action update = ({ point, zoom }: Partial<{ point: number[]; zoom: number }>): this => {
    if (point !== undefined) this.camera.point = point
    if (zoom !== undefined) this.camera.zoom = zoom
    return this
  }

  private _currentView = {
    minX: 0,
    minY: 0,
    maxX: 1,
    maxY: 1,
    width: 1,
    height: 1,
  }

  @computed get currentView(): TLBounds {
    const {
      bounds,
      camera: { point, zoom },
    } = this
    const w = bounds.width / zoom
    const h = bounds.height / zoom
    return {
      minX: -point[0],
      minY: -point[1],
      maxX: w - point[0],
      maxY: h - point[1],
      width: w,
      height: h,
    }
  }

  getPagePoint = (point: number[]): number[] => {
    const { camera, bounds } = this
    return Vec.sub(Vec.div(Vec.sub(point, [bounds.minX, bounds.minY]), camera.zoom), camera.point)
  }

  getScreenPoint = (point: number[]): number[] => {
    const { camera } = this
    return Vec.mul(Vec.add(point, camera.point), camera.zoom)
  }

  pinchCamera = (point: number[], delta: number[], zoom: number): this => {
    const { camera } = this
    zoom = Math.max(TLViewport.minZoom, Math.min(TLViewport.maxZoom, zoom))
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
    const p1 = Vec.sub(Vec.div(point, zoom), nextPoint)
    return this.update({ point: Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom })
  }

  setZoom = (zoom: number) => {
    const { bounds } = this
    const center = [bounds.width / 2, bounds.height / 2]
    this.pinchCamera(center, [0, 0], zoom)
  }

  zoomIn = () => {
    const { camera } = this
    this.setZoom(camera.zoom / ZOOM_UPDATE_FACTOR)
  }

  zoomOut = () => {
    const { camera, bounds } = this
    this.setZoom(camera.zoom * ZOOM_UPDATE_FACTOR)
  }

  resetZoom = (): this => {
    const {
      bounds,
      camera: { zoom, point },
    } = this
    const center = [bounds.width / 2, bounds.height / 2]
    const p0 = Vec.sub(Vec.div(center, zoom), point)
    const p1 = Vec.sub(Vec.div(center, 1), point)
    return this.update({ point: Vec.toFixed(Vec.add(point, Vec.sub(p1, p0))), zoom: 1 })
  }

  zoomToBounds = ({ width, height, minX, minY }: TLBounds): this => {
    const { bounds, camera } = this
    let zoom = Math.min(
      (bounds.width - FIT_TO_SCREEN_PADDING) / width,
      (bounds.height - FIT_TO_SCREEN_PADDING) / height
    )
    zoom = Math.min(
      1,
      Math.max(
        TLViewport.minZoom,
        camera.zoom === zoom || camera.zoom < 1 ? Math.min(1, zoom) : zoom
      )
    )
    const delta = [
      (bounds.width - width * zoom) / 2 / zoom,
      (bounds.height - height * zoom) / 2 / zoom,
    ]
    return this.update({ point: Vec.add([-minX, -minY], delta), zoom })
  }
}
