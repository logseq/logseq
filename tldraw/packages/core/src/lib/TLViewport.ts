import { Vec } from '@tldraw/vec'
import { action, computed, makeObservable, observable } from 'mobx'
import { FIT_TO_SCREEN_PADDING, ZOOM_UPDATE_FACTOR } from '../constants'
import type { TLBounds } from '../types'

const ease = (x: number) => {
  return x * x
}

const elapsedProgress = (t: number) => {
  return ease(Vec.clamp(t / 200, 0, 1)) // 200ms
}

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
   * @param point The current point under the cursor.
   * @param delta The movement delta.
   * @param zoom The new zoom level
   */
  pinchZoom = (point: number[], delta: number[], zoom: number, animate = false): this => {
    const { camera } = this

    const runZoom = (currentZoom: number) => {
      const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
      currentZoom = Vec.clamp(currentZoom, TLViewport.minZoom, TLViewport.maxZoom)
      const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
      const p1 = Vec.sub(Vec.div(point, currentZoom), nextPoint)
      this.update({ point: Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom: currentZoom })
    }

    if (animate) {
      const diff = zoom - camera.zoom
      const initialZoom = camera.zoom
      const startTime = performance.now()
      const step = () => {
        const elapsed = performance.now() - startTime
        const progress = elapsedProgress(elapsed) // 0 ~ 1, 100ms
        const currentZoom = initialZoom + diff * progress
        console.log(progress)
        runZoom(currentZoom)
        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          runZoom(zoom)
        }
      }
      step()
    } else {
      runZoom(zoom)
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
    const { camera, bounds } = this
    this.setZoom(camera.zoom * ZOOM_UPDATE_FACTOR, true)
  }

  resetZoom = (): this => {
    this.setZoom(1, true)
    return this
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

    const originalPoint = camera.point
    const originalZoom = camera.zoom
    const zoomDiff = zoom - camera.zoom
    const positionDiff = Vec.sub(point, camera.point)

    // Animate by default
    const startTime = performance.now()
    const step = () => {
      const elapsed = performance.now() - startTime
      const progress = elapsedProgress(elapsed) // 0 ~ 1, 100ms
      const currentZoom = originalZoom + zoomDiff * progress
      // fixme: the point should be calculated by the CURRENT zoom, not the final zoom
      const currentPoint = Vec.add(originalPoint, Vec.mul(positionDiff, progress))
      this.update({ point: currentPoint, zoom: currentZoom })
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        this.update({ point, zoom })
      }
    }
    step()
  }
}
