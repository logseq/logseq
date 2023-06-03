import { Vec } from '@tldraw/vec'
import { action, computed, makeObservable, observable } from 'mobx'
import { FIT_TO_SCREEN_PADDING, ZOOM_UPDATE_FACTOR } from '../constants'
import type { TLBounds } from '../types'

const ease = (x: number) => {
  return -(Math.cos(Math.PI * x) - 1) / 2
}

const elapsedProgress = (t: number, duration = 100) => {
  return ease(Vec.clamp(t / duration, 0, 1))
}

export class TLViewport {
  constructor() {
    makeObservable(this)
  }

  static readonly minZoom = 0.1
  static readonly maxZoom = 4
  static readonly panMultiplier = 0.05
  static readonly panThreshold = 100

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

  panToPointWhenNearBounds = (point: number[]) => {
    const threshold = [TLViewport.panThreshold, TLViewport.panThreshold]

    const deltaMax = Vec.sub([this.currentView.maxX, this.currentView.maxY], Vec.add(point, threshold))
    const deltaMin = Vec.sub([this.currentView.minX, this.currentView.minY], Vec.sub(point, threshold))

    const deltaX = deltaMax[0] < 0 ? deltaMax[0] : deltaMin[0] > 0 ? deltaMin[0] : 0
    const deltaY = deltaMax[1] < 0 ? deltaMax[1] : deltaMin[1] > 0 ? deltaMin[1] : 0

    this.panCamera(Vec.mul([deltaX, deltaY], -TLViewport.panMultiplier))
}


  @action update = ({ point, zoom }: Partial<{ point: number[]; zoom: number }>): this => {
    if (point !== undefined && !isNaN(point[0]) && !isNaN(point[1])) this.camera.point = point
    if (zoom !== undefined && !isNaN(zoom)) this.camera.zoom = Math.min(4, Math.max(0.1, zoom))
    return this
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

  onZoom = (point: number[], zoom: number, animate = false): this => {
    return this.pinchZoom(point, [0, 0], zoom, animate)
  }

  /**
   * Pinch to a new zoom level, possibly together with a pan.
   *
   * @param point The current point under the cursor in the screen space. Zoom will be transformed
   *   around this point.
   * @param delta The movement delta in the screen space
   * @param zoom The new zoom level
   */
  pinchZoom = (point: number[], delta: number[], zoom: number, animate = false): this => {
    const { camera } = this

    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    zoom = Vec.clamp(zoom, TLViewport.minZoom, TLViewport.maxZoom)
    const p0 = Vec.div(point, camera.zoom)
    const p1 = Vec.div(point, zoom)

    const newPoint = Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0)))

    if (animate) {
      this.animateCamera({ point: newPoint, zoom })
    } else {
      this.update({ point: newPoint, zoom })
    }

    return this
  }

  setZoom = (zoom: number, animate = false) => {
    const { bounds } = this
    const center = [bounds.width / 2, bounds.height / 2]
    this.onZoom(center, zoom, animate)
  }

  zoomIn = () => {
    const { camera } = this
    this.setZoom(camera.zoom / ZOOM_UPDATE_FACTOR, true)
  }

  zoomOut = () => {
    const { camera } = this
    this.setZoom(camera.zoom * ZOOM_UPDATE_FACTOR, true)
  }

  resetZoom = (): this => {
    this.setZoom(1, true)
    return this
  }

  /** Animate the camera to the given position */
  animateCamera = ({ point, zoom }: { point: number[]; zoom: number }) => {
    return this.animateToViewport({
      minX: -point[0],
      minY: -point[1],
      maxX: this.bounds.width / zoom - point[0],
      maxY: this.bounds.height / zoom - point[1],
      width: this.bounds.width / zoom,
      height: this.bounds.height / zoom,
    })
  }

  animateToViewport = (view: TLBounds) => {
    const startTime = performance.now()
    const oldView = { ...this.currentView }

    const step = () => {
      const elapsed = performance.now() - startTime
      const progress = elapsedProgress(elapsed) // 0 ~ 1
      const next = {
        minX: oldView.minX + (view.minX - oldView.minX) * progress,
        minY: oldView.minY + (view.minY - oldView.minY) * progress,
        maxX: oldView.maxX + (view.maxX - oldView.maxX) * progress,
        maxY: oldView.maxY + (view.maxY - oldView.maxY) * progress,
      }

      const point = [-next.minX, -next.minY]
      const zoom = this.bounds.width / (next.maxX - next.minX)

      this.update({ point, zoom })
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    step()
  }

  zoomToBounds = ({ width, height, minX, minY }: TLBounds) => {
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

    const point = Vec.add([-minX, -minY], delta)
    this.animateCamera({ point, zoom })
  }
}
