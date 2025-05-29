/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TLBounds } from '@tldraw/intersect'
import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

const SVG_EXPORT_PADDING = 16

export class PointingMinimapState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingMinimap'

  minimapZoom = 1
  minimapRect: TLBounds = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    width: 0,
    height: 0,
  }

  getCameraPoint = (clientPoint: [number, number]) => {
    const minimapContainer = document.querySelector<HTMLElement>('.tl-preview-minimap svg')
    const minimapCamera = document.querySelector<HTMLElement>(
      '.tl-preview-minimap #minimap-camera-rect'
    )
    if (minimapContainer && minimapCamera) {
      const rect = minimapContainer.getBoundingClientRect()
      this.minimapRect.height = rect.height
      this.minimapRect.width = rect.width
      this.minimapRect.minX = rect.left
      this.minimapRect.minY = rect.top
      this.minimapRect.maxX = rect.right
      this.minimapRect.maxY = rect.bottom
      this.minimapZoom = +minimapContainer.dataset.commonBoundWidth! / this.minimapRect.width

      const cursorInSvg = Vec.sub(clientPoint, [this.minimapRect.minX, this.minimapRect.minY])
      const minimapCameraRect = minimapCamera.getBoundingClientRect()
      const minimapCameraCenter = [
        minimapCameraRect.left + minimapCameraRect.width / 2,
        minimapCameraRect.top + minimapCameraRect.height / 2,
      ]
      const delta = Vec.mul(Vec.sub(cursorInSvg, minimapCameraCenter), this.minimapZoom)
      return Vec.sub(this.app.viewport.camera.point, delta)
    }
    return
  }

  onEnter = (info: any) => {
    const newCameraPoint = this.getCameraPoint([info.clientX, info.clientY])
    if (newCameraPoint) {
      this.app.viewport.update({
        point: newCameraPoint,
      })
    } else {
      this.tool.transition('idle')
    }
  }

  onPointerMove: TLEvents<S>['pointer'] = (info, e) => {
    if ('clientX' in e) {
      const newCameraPoint = this.getCameraPoint([e.clientX, e.clientY])
      if (newCameraPoint) {
        this.app.viewport.update({
          point: newCameraPoint,
        })
      }
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }
}
