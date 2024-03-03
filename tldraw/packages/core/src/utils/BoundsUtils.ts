/* eslint-disable @typescript-eslint/no-extra-semi */
import { Vec } from '@tldraw/vec'
import potpack from 'potpack'
import type { TLShape } from '../lib'
import {
  type TLBounds,
  TLResizeCorner,
  TLResizeEdge,
  type TLBoundsWithCenter,
  TLSnapPoints,
  type TLSnap,
  DistributeType,
} from '../types'

export class BoundsUtils {
  static getRectangleSides(point: number[], size: number[], rotation = 0): [string, number[][]][] {
    const center = [point[0] + size[0] / 2, point[1] + size[1] / 2]
    const tl = Vec.rotWith(point, center, rotation)
    const tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation)
    const br = Vec.rotWith(Vec.add(point, size), center, rotation)
    const bl = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation)

    return [
      ['top', [tl, tr]],
      ['right', [tr, br]],
      ['bottom', [br, bl]],
      ['left', [bl, tl]],
    ]
  }

  static getBoundsSides(bounds: TLBounds): [string, number[][]][] {
    return BoundsUtils.getRectangleSides([bounds.minX, bounds.minY], [bounds.width, bounds.height])
  }

  /**
   * Expand a bounding box by a delta.
   *
   * ### Example
   *
   * ```ts
   * expandBounds(myBounds, [100, 100])
   * ```
   */
  static expandBounds(bounds: TLBounds, delta: number): TLBounds {
    return {
      minX: bounds.minX - delta,
      minY: bounds.minY - delta,
      maxX: bounds.maxX + delta,
      maxY: bounds.maxY + delta,
      width: bounds.width + delta * 2,
      height: bounds.height + delta * 2,
    }
  }

  /**
   * Get whether bounds A collides with bounds B.
   *
   * @param a Bounds
   * @param b Bounds
   * @returns
   */
  static boundsCollide(a: TLBounds, b: TLBounds): boolean {
    return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY)
  }

  /**
   * Get whether the bounds of A contain the bounds/point of B. A perfect match will return true.
   *
   * @param a Bounds
   * @param b Bounds|point
   * @returns
   */
  static boundsContain(a: TLBounds, b: TLBounds | number[]): boolean {
    if (Array.isArray(b)) {
      return a.minX < b[0] && a.minY < b[1] && a.maxY > b[1] && a.maxX > b[0]
    }
    return a.minX < b.minX && a.minY < b.minY && a.maxY > b.maxY && a.maxX > b.maxX
  }

  /**
   * Get whether the bounds of A are contained by the bounds of B.
   *
   * @param a Bounds
   * @param b Bounds
   * @returns
   */
  static boundsContained(a: TLBounds, b: TLBounds): boolean {
    return BoundsUtils.boundsContain(b, a)
  }

  /**
   * Get whether two bounds are identical.
   *
   * @param a Bounds
   * @param b Bounds
   * @returns
   */
  static boundsAreEqual(a: TLBounds, b: TLBounds): boolean {
    return !(b.maxX !== a.maxX || b.minX !== a.minX || b.maxY !== a.maxY || b.minY !== a.minY)
  }

  /**
   * Find a bounding box from an array of points.
   *
   * @param points
   * @param rotation (optional) The bounding box's rotation.
   */
  static getBoundsFromPoints(points: number[][], rotation = 0): TLBounds {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    if (points.length < 2) {
      minX = 0
      minY = 0
      maxX = 1
      maxY = 1
    } else {
      for (const point of points) {
        minX = Math.min(point[0], minX)
        minY = Math.min(point[1], minY)
        maxX = Math.max(point[0], maxX)
        maxY = Math.max(point[1], maxY)
      }
    }
    if (rotation !== 0) {
      return BoundsUtils.getBoundsFromPoints(
        points.map(pt => Vec.rotWith(pt, [(minX + maxX) / 2, (minY + maxY) / 2], rotation))
      )
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    }
  }

  /**
   * Center a bounding box around a given point.
   *
   * @param bounds
   * @param center
   */
  static centerBounds(bounds: TLBounds, point: number[]): TLBounds {
    const boundsCenter = BoundsUtils.getBoundsCenter(bounds)
    const dx = point[0] - boundsCenter[0]
    const dy = point[1] - boundsCenter[1]
    return BoundsUtils.translateBounds(bounds, [dx, dy])
  }

  /**
   * Snap a bounding box to a grid size.
   *
   * @param bounds
   * @param gridSize
   */
  static snapBoundsToGrid(bounds: TLBounds, gridSize: number): TLBounds {
    const minX = Math.round(bounds.minX / gridSize) * gridSize
    const minY = Math.round(bounds.minY / gridSize) * gridSize
    const maxX = Math.round(bounds.maxX / gridSize) * gridSize
    const maxY = Math.round(bounds.maxY / gridSize) * gridSize
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    }
  }

  /**
   * Move a bounding box without recalculating it.
   *
   * @param bounds
   * @param delta
   * @returns
   */
  static translateBounds(bounds: TLBounds, delta: number[]): TLBounds {
    return {
      minX: bounds.minX + delta[0],
      minY: bounds.minY + delta[1],
      maxX: bounds.maxX + delta[0],
      maxY: bounds.maxY + delta[1],
      width: bounds.width,
      height: bounds.height,
    }
  }

  static multiplyBounds(bounds: TLBounds, n: number) {
    const center = BoundsUtils.getBoundsCenter(bounds)
    return BoundsUtils.centerBounds(
      {
        minX: bounds.minX * n,
        minY: bounds.minY * n,
        maxX: bounds.maxX * n,
        maxY: bounds.maxY * n,
        width: bounds.width * n,
        height: bounds.height * n,
      },
      [center[0] * n, center[1] * n]
    )
  }

  static divideBounds(bounds: TLBounds, n: number) {
    const center = BoundsUtils.getBoundsCenter(bounds)
    return BoundsUtils.centerBounds(
      {
        minX: bounds.minX / n,
        minY: bounds.minY / n,
        maxX: bounds.maxX / n,
        maxY: bounds.maxY / n,
        width: bounds.width / n,
        height: bounds.height / n,
      },
      [center[0] / n, center[1] / n]
    )
  }

  /**
   * Get an axis-aligned bounding box that fits around a rotated bounding box.
   *
   * @param bounds
   * @param center
   * @param rotation
   */
  static getRotatedBounds(bounds: TLBounds, rotation = 0): TLBounds {
    const corners = BoundsUtils.getRotatedCorners(bounds, rotation)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const point of corners) {
      minX = Math.min(point[0], minX)
      minY = Math.min(point[1], minY)
      maxX = Math.max(point[0], maxX)
      maxY = Math.max(point[1], maxY)
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      rotation: 0,
    }
  }

  /**
   * Get the rotated bounds of an ellipse.
   *
   * @param x
   * @param y
   * @param rx
   * @param ry
   * @param rotation
   */
  static getRotatedEllipseBounds(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rotation = 0
  ): TLBounds {
    const c = Math.cos(rotation)
    const s = Math.sin(rotation)
    const w = Math.hypot(rx * c, ry * s)
    const h = Math.hypot(rx * s, ry * c)
    return {
      minX: x + rx - w,
      minY: y + ry - h,
      maxX: x + rx + w,
      maxY: y + ry + h,
      width: w * 2,
      height: h * 2,
    }
  }

  /**
   * Get a bounding box that includes two bounding boxes.
   *
   * @param a Bounding box
   * @param b Bounding box
   * @returns
   */
  static getExpandedBounds(a: TLBounds, b: TLBounds): TLBounds {
    const minX = Math.min(a.minX, b.minX)
    const minY = Math.min(a.minY, b.minY)
    const maxX = Math.max(a.maxX, b.maxX)
    const maxY = Math.max(a.maxY, b.maxY)
    const width = Math.abs(maxX - minX)
    const height = Math.abs(maxY - minY)
    return { minX, minY, maxX, maxY, width, height }
  }

  /**
   * Get the common bounds of a group of bounds.
   *
   * @returns
   */
  static getCommonBounds(bounds: TLBounds[]): TLBounds {
    if (bounds.length < 2) return bounds[0]
    let result = bounds[0]
    for (let i = 1; i < bounds.length; i++) {
      result = BoundsUtils.getExpandedBounds(result, bounds[i])
    }
    return result
  }

  static getRotatedCorners(b: TLBounds, rotation = 0): number[][] {
    const center = [b.minX + b.width / 2, b.minY + b.height / 2]
    const corners = [
      [b.minX, b.minY],
      [b.maxX, b.minY],
      [b.maxX, b.maxY],
      [b.minX, b.maxY],
    ]
    if (rotation) return corners.map(point => Vec.rotWith(point, center, rotation))
    return corners
  }

  static getTransformedBoundingBox(
    bounds: TLBounds,
    handle: TLResizeCorner | TLResizeEdge | 'center',
    delta: number[],
    rotation = 0,
    isAspectRatioLocked = false
  ): TLBounds & { scaleX: number; scaleY: number } {
    // Create top left and bottom right corners.
    const [ax0, ay0] = [bounds.minX, bounds.minY]
    const [ax1, ay1] = [bounds.maxX, bounds.maxY]

    // Create a second set of corners for the new box.
    let [bx0, by0] = [bounds.minX, bounds.minY]
    let [bx1, by1] = [bounds.maxX, bounds.maxY]

    // If the drag is on the center, just translate the bounds.
    if (handle === 'center') {
      return {
        minX: bx0 + delta[0],
        minY: by0 + delta[1],
        maxX: bx1 + delta[0],
        maxY: by1 + delta[1],
        width: bx1 - bx0,
        height: by1 - by0,
        scaleX: 1,
        scaleY: 1,
      }
    }

    // Counter rotate the delta. This lets us make changes as if
    // the (possibly rotated) boxes were axis aligned.
    const [dx, dy] = Vec.rot(delta, -rotation)

    /*
1. Delta

Use the delta to adjust the new box by changing its corners.
The dragging handle (corner or edge) will determine which
corners should change.
*/
    switch (handle) {
      case TLResizeEdge.Top:
      case TLResizeCorner.TopLeft:
      case TLResizeCorner.TopRight: {
        by0 += dy
        break
      }
      case TLResizeEdge.Bottom:
      case TLResizeCorner.BottomLeft:
      case TLResizeCorner.BottomRight: {
        by1 += dy
        break
      }
    }

    switch (handle) {
      case TLResizeEdge.Left:
      case TLResizeCorner.TopLeft:
      case TLResizeCorner.BottomLeft: {
        bx0 += dx
        break
      }
      case TLResizeEdge.Right:
      case TLResizeCorner.TopRight:
      case TLResizeCorner.BottomRight: {
        bx1 += dx
        break
      }
    }

    const aw = ax1 - ax0
    const ah = ay1 - ay0

    const scaleX = (bx1 - bx0) / aw
    const scaleY = (by1 - by0) / ah

    const flipX = scaleX < 0
    const flipY = scaleY < 0

    const bw = Math.abs(bx1 - bx0)
    const bh = Math.abs(by1 - by0)

    /*
2. Aspect ratio

If the aspect ratio is locked, adjust the corners so that the
new box's aspect ratio matches the original aspect ratio.
*/

    if (isAspectRatioLocked) {
      const ar = aw / ah
      const isTall = ar < bw / bh
      const tw = bw * (scaleY < 0 ? 1 : -1) * (1 / ar)
      const th = bh * (scaleX < 0 ? 1 : -1) * ar

      switch (handle) {
        case TLResizeCorner.TopLeft: {
          if (isTall) by0 = by1 + tw
          else bx0 = bx1 + th
          break
        }
        case TLResizeCorner.TopRight: {
          if (isTall) by0 = by1 + tw
          else bx1 = bx0 - th
          break
        }
        case TLResizeCorner.BottomRight: {
          if (isTall) by1 = by0 - tw
          else bx1 = bx0 - th
          break
        }
        case TLResizeCorner.BottomLeft: {
          if (isTall) by1 = by0 - tw
          else bx0 = bx1 + th
          break
        }
        case TLResizeEdge.Bottom:
        case TLResizeEdge.Top: {
          const m = (bx0 + bx1) / 2
          const w = bh * ar
          bx0 = m - w / 2
          bx1 = m + w / 2
          break
        }
        case TLResizeEdge.Left:
        case TLResizeEdge.Right: {
          const m = (by0 + by1) / 2
          const h = bw / ar
          by0 = m - h / 2
          by1 = m + h / 2
          break
        }
      }
    }

    /*
3. Rotation

If the bounds are rotated, get a Vector from the rotated anchor
corner in the initial bounds to the rotated anchor corner in the
result's bounds. Subtract this Vector from the result's corners,
so that the two anchor points (initial and result) will be equal.
*/

    if (rotation % (Math.PI * 2) !== 0) {
      let cv = [0, 0]

      const c0 = Vec.med([ax0, ay0], [ax1, ay1])
      const c1 = Vec.med([bx0, by0], [bx1, by1])

      switch (handle) {
        case TLResizeCorner.TopLeft: {
          cv = Vec.sub(Vec.rotWith([bx1, by1], c1, rotation), Vec.rotWith([ax1, ay1], c0, rotation))
          break
        }
        case TLResizeCorner.TopRight: {
          cv = Vec.sub(Vec.rotWith([bx0, by1], c1, rotation), Vec.rotWith([ax0, ay1], c0, rotation))
          break
        }
        case TLResizeCorner.BottomRight: {
          cv = Vec.sub(Vec.rotWith([bx0, by0], c1, rotation), Vec.rotWith([ax0, ay0], c0, rotation))
          break
        }
        case TLResizeCorner.BottomLeft: {
          cv = Vec.sub(Vec.rotWith([bx1, by0], c1, rotation), Vec.rotWith([ax1, ay0], c0, rotation))
          break
        }
        case TLResizeEdge.Top: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by1], [bx1, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay1], [ax1, ay1]), c0, rotation)
          )
          break
        }
        case TLResizeEdge.Left: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx1, by0], [bx1, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax1, ay0], [ax1, ay1]), c0, rotation)
          )
          break
        }
        case TLResizeEdge.Bottom: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by0], [bx1, by0]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay0], [ax1, ay0]), c0, rotation)
          )
          break
        }
        case TLResizeEdge.Right: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by0], [bx0, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay0], [ax0, ay1]), c0, rotation)
          )
          break
        }
      }

      ;[bx0, by0] = Vec.sub([bx0, by0], cv)
      ;[bx1, by1] = Vec.sub([bx1, by1], cv)
    }

    /*
4. Flips

If the axes are flipped (e.g. if the right edge has been dragged
left past the initial left edge) then swap points on that axis.
*/

    if (bx1 < bx0) {
      ;[bx1, bx0] = [bx0, bx1]
    }

    if (by1 < by0) {
      ;[by1, by0] = [by0, by1]
    }

    return {
      minX: bx0,
      minY: by0,
      maxX: bx1,
      maxY: by1,
      width: bx1 - bx0,
      height: by1 - by0,
      scaleX: ((bx1 - bx0) / (ax1 - ax0 || 1)) * (flipX ? -1 : 1),
      scaleY: ((by1 - by0) / (ay1 - ay0 || 1)) * (flipY ? -1 : 1),
    }
  }

  static getTransformAnchor(
    type: TLResizeEdge | TLResizeCorner,
    isFlippedX: boolean,
    isFlippedY: boolean
  ): TLResizeCorner | TLResizeEdge {
    let anchor: TLResizeCorner | TLResizeEdge = type
    // Change corner anchors if flipped
    switch (type) {
      case TLResizeCorner.TopLeft: {
        if (isFlippedX && isFlippedY) {
          anchor = TLResizeCorner.BottomRight
        } else if (isFlippedX) {
          anchor = TLResizeCorner.TopRight
        } else if (isFlippedY) {
          anchor = TLResizeCorner.BottomLeft
        } else {
          anchor = TLResizeCorner.BottomRight
        }
        break
      }
      case TLResizeCorner.TopRight: {
        if (isFlippedX && isFlippedY) {
          anchor = TLResizeCorner.BottomLeft
        } else if (isFlippedX) {
          anchor = TLResizeCorner.TopLeft
        } else if (isFlippedY) {
          anchor = TLResizeCorner.BottomRight
        } else {
          anchor = TLResizeCorner.BottomLeft
        }
        break
      }
      case TLResizeCorner.BottomRight: {
        if (isFlippedX && isFlippedY) {
          anchor = TLResizeCorner.TopLeft
        } else if (isFlippedX) {
          anchor = TLResizeCorner.BottomLeft
        } else if (isFlippedY) {
          anchor = TLResizeCorner.TopRight
        } else {
          anchor = TLResizeCorner.TopLeft
        }
        break
      }
      case TLResizeCorner.BottomLeft: {
        if (isFlippedX && isFlippedY) {
          anchor = TLResizeCorner.TopRight
        } else if (isFlippedX) {
          anchor = TLResizeCorner.BottomRight
        } else if (isFlippedY) {
          anchor = TLResizeCorner.TopLeft
        } else {
          anchor = TLResizeCorner.TopRight
        }
        break
      }
    }
    return anchor
  }

  /**
   * Get the relative bounds (usually a child) within a transformed bounding box.
   *
   * @param bounds
   * @param initialBounds
   * @param initialShapeBounds
   * @param isFlippedX
   * @param isFlippedY
   */
  static getRelativeTransformedBoundingBox(
    bounds: TLBounds,
    initialBounds: TLBounds,
    initialShapeBounds: TLBounds,
    isFlippedX: boolean,
    isFlippedY: boolean
  ): TLBounds {
    const nx =
      (isFlippedX
        ? initialBounds.maxX - initialShapeBounds.maxX
        : initialShapeBounds.minX - initialBounds.minX) / initialBounds.width
    const ny =
      (isFlippedY
        ? initialBounds.maxY - initialShapeBounds.maxY
        : initialShapeBounds.minY - initialBounds.minY) / initialBounds.height
    const nw = initialShapeBounds.width / initialBounds.width
    const nh = initialShapeBounds.height / initialBounds.height
    const minX = bounds.minX + bounds.width * nx
    const minY = bounds.minY + bounds.height * ny
    const width = bounds.width * nw
    const height = bounds.height * nh
    return {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
      width,
      height,
    }
  }

  /**
   * Get the size of a rotated box.
   *
   * @param size : ;
   * @param rotation
   */
  static getRotatedSize(size: number[], rotation: number): number[] {
    const center = Vec.div(size, 2)

    const points = [[0, 0], [size[0], 0], size, [0, size[1]]].map(point =>
      Vec.rotWith(point, center, rotation)
    )

    const bounds = BoundsUtils.getBoundsFromPoints(points)

    return [bounds.width, bounds.height]
  }

  /**
   * Get the center of a bounding box.
   *
   * @param bounds
   */
  static getBoundsCenter(bounds: TLBounds): number[] {
    return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2]
  }

  /**
   * Get a bounding box with a midX and midY.
   *
   * @param bounds
   */
  static getBoundsWithCenter(bounds: TLBounds): TLBoundsWithCenter {
    const center = BoundsUtils.getBoundsCenter(bounds)
    return {
      ...bounds,
      midX: center[0],
      midY: center[1],
    }
  }

  /**
   * Given a set of points, get their common [minX, minY].
   *
   * @param points
   */
  static getCommonTopLeft(points: number[][]) {
    const min = [Infinity, Infinity]

    points.forEach(point => {
      min[0] = Math.min(min[0], point[0])
      min[1] = Math.min(min[1], point[1])
    })

    return min
  }

  static getTLSnapPoints(
    bounds: TLBoundsWithCenter,
    others: TLBoundsWithCenter[],
    snapDistance: number
  ) {
    const A = { ...bounds }

    const offset = [0, 0]

    const snapLines: number[][][] = []

    // 1.
    // Find the snap points for the x and y axes

    const snaps: Record<TLSnapPoints, TLSnap> = {
      [TLSnapPoints.minX]: { id: TLSnapPoints.minX, isSnapped: false },
      [TLSnapPoints.midX]: { id: TLSnapPoints.midX, isSnapped: false },
      [TLSnapPoints.maxX]: { id: TLSnapPoints.maxX, isSnapped: false },
      [TLSnapPoints.minY]: { id: TLSnapPoints.minY, isSnapped: false },
      [TLSnapPoints.midY]: { id: TLSnapPoints.midY, isSnapped: false },
      [TLSnapPoints.maxY]: { id: TLSnapPoints.maxY, isSnapped: false },
    }

    const xs = [TLSnapPoints.midX, TLSnapPoints.minX, TLSnapPoints.maxX]
    const ys = [TLSnapPoints.midY, TLSnapPoints.minY, TLSnapPoints.maxY]

    const snapResults = others.map(B => {
      const rx = xs.flatMap((f, i) =>
        xs.map((t, k) => {
          const gap = A[f] - B[t]
          const distance = Math.abs(gap)
          return {
            f,
            t,
            gap,
            distance,
            isCareful: i === 0 || i + k === 3,
          }
        })
      )

      const ry = ys.flatMap((f, i) =>
        ys.map((t, k) => {
          const gap = A[f] - B[t]
          const distance = Math.abs(gap)
          return {
            f,
            t,
            gap,
            distance,
            isCareful: i === 0 || i + k === 3,
          }
        })
      )

      return [B, rx, ry] as const
    })

    let gapX = Infinity
    let gapY = Infinity

    let minX = Infinity
    let minY = Infinity

    snapResults.forEach(([_, rx, ry]) => {
      rx.forEach(r => {
        if (r.distance < snapDistance && r.distance < minX) {
          minX = r.distance
          gapX = r.gap
        }
      })

      ry.forEach(r => {
        if (r.distance < snapDistance && r.distance < minY) {
          minY = r.distance
          gapY = r.gap
        }
      })
    })

    // Check for other shapes with the same gap

    snapResults.forEach(([B, rx, ry]) => {
      if (gapX !== Infinity) {
        rx.forEach(r => {
          if (Math.abs(r.gap - gapX) < 2) {
            snaps[r.f] = {
              ...snaps[r.f],
              isSnapped: true,
              to: B[r.t],
              B,
              distance: r.distance,
            }
          }
        })
      }

      if (gapY !== Infinity) {
        ry.forEach(r => {
          if (Math.abs(r.gap - gapY) < 2) {
            snaps[r.f] = {
              ...snaps[r.f],
              isSnapped: true,
              to: B[r.t],
              B,
              distance: r.distance,
            }
          }
        })
      }
    })

    offset[0] = gapX === Infinity ? 0 : gapX
    offset[1] = gapY === Infinity ? 0 : gapY

    A.minX -= offset[0]
    A.midX -= offset[0]
    A.maxX -= offset[0]
    A.minY -= offset[1]
    A.midY -= offset[1]
    A.maxY -= offset[1]

    // 2.
    // Calculate snap lines based on adjusted bounds A. This has
    // to happen after we've adjusted both dimensions x and y of
    // the bounds A!
    xs.forEach(from => {
      const snap = snaps[from]

      if (!snap.isSnapped) return

      const { id, B } = snap
      const x = A[id]

      // If A is snapped at its center, show include only the midY;
      // otherwise, include both its minY and maxY.
      snapLines.push(
        id === TLSnapPoints.minX
          ? [
              [x, A.midY],
              [x, B.minY],
              [x, B.maxY],
            ]
          : [
              [x, A.minY],
              [x, A.maxY],
              [x, B.minY],
              [x, B.maxY],
            ]
      )
    })

    ys.forEach(from => {
      const snap = snaps[from]

      if (!snap.isSnapped) return

      const { id, B } = snap
      const y = A[id]

      snapLines.push(
        id === TLSnapPoints.midY
          ? [
              [A.midX, y],
              [B.minX, y],
              [B.maxX, y],
            ]
          : [
              [A.minX, y],
              [A.maxX, y],
              [B.minX, y],
              [B.maxX, y],
            ]
      )
    })

    return { offset, snapLines }
  }

  static ensureRatio(bounds: TLBounds, ratio: number): TLBounds {
    const { width, height } = bounds

    const newBounds = { ...bounds }

    if (width / height < ratio) {
      newBounds.width = height * ratio
      newBounds.maxX += width - bounds.width
    } else {
      newBounds.height = width / ratio
      newBounds.maxY += height - bounds.height
    }
    return newBounds
  }

  static getDistributions(shapes: TLShape[], type: DistributeType) {
    const entries = shapes.map(shape => {
      const bounds = shape.getBounds()
      return {
        id: shape.id,
        point: [bounds.minX, bounds.minY],
        bounds: bounds,
        center: shape.getCenter(),
      }
    })

    const len = entries.length
    const commonBounds = BoundsUtils.getCommonBounds(entries.map(({ bounds }) => bounds))

    const results: { id: string; prev: number[]; next: number[] }[] = []

    switch (type) {
      case DistributeType.Horizontal: {
        const span = entries.reduce((a, c) => a + c.bounds.width, 0)

        if (span > commonBounds.width) {
          const left = entries.sort((a, b) => a.bounds.minX - b.bounds.minX)[0]

          const right = entries.sort((a, b) => b.bounds.maxX - a.bounds.maxX)[0]

          const entriesToMove = entries
            .filter(a => a !== left && a !== right)
            .sort((a, b) => a.center[0] - b.center[0])

          const step = (right.center[0] - left.center[0]) / (len - 1)

          const x = left.center[0] + step

          entriesToMove.forEach(({ id, point, bounds }, i) => {
            results.push({
              id,
              prev: point,
              next: [x + step * i - bounds.width / 2, bounds.minY],
            })
          })
        } else {
          const entriesToMove = entries.sort((a, b) => a.center[0] - b.center[0])

          let x = commonBounds.minX
          const step = (commonBounds.width - span) / (len - 1)

          entriesToMove.forEach(({ id, point, bounds }) => {
            results.push({ id, prev: point, next: [x, bounds.minY] })
            x += bounds.width + step
          })
        }
        break
      }
      case DistributeType.Vertical: {
        const span = entries.reduce((a, c) => a + c.bounds.height, 0)

        if (span > commonBounds.height) {
          const top = entries.sort((a, b) => a.bounds.minY - b.bounds.minY)[0]

          const bottom = entries.sort((a, b) => b.bounds.maxY - a.bounds.maxY)[0]

          const entriesToMove = entries
            .filter(a => a !== top && a !== bottom)
            .sort((a, b) => a.center[1] - b.center[1])

          const step = (bottom.center[1] - top.center[1]) / (len - 1)

          const y = top.center[1] + step

          entriesToMove.forEach(({ id, point, bounds }, i) => {
            results.push({
              id,
              prev: point,
              next: [bounds.minX, y + step * i - bounds.height / 2],
            })
          })
        } else {
          const entriesToMove = entries.sort((a, b) => a.center[1] - b.center[1])

          let y = commonBounds.minY
          const step = (commonBounds.height - span) / (len - 1)

          entriesToMove.forEach(({ id, point, bounds }) => {
            results.push({ id, prev: point, next: [bounds.minX, y] })
            y += bounds.height + step
          })
        }

        break
      }
    }

    return results
  }

  // pack shapes into a rectangle
  static getPackedDistributions(shapes: TLShape[]) {
    const commonBounds = BoundsUtils.getCommonBounds(shapes.map(({ bounds }) => bounds))
    const origin = [commonBounds.minX, commonBounds.minY]
    const shapesPosOriginal: Record<string, number[]> = Object.fromEntries(
      shapes.map(s => [s.id, [s.bounds.minX, s.bounds.minY]])
    )
    const entries = shapes
      .filter(s => !(s.props.handles?.start?.bindingId || s.props.handles?.end?.bindingId))
      .map(shape => {
        const bounds = shape.getBounds()
        return {
          id: shape.id,
          w: bounds.width + 16,
          h: bounds.height + 16,
          x: bounds.minX,
          y: bounds.minY,
        }
      })

    potpack(entries)

    const entriesToMove = entries.map(({ id, x, y }) => {
      return {
        id,
        prev: shapesPosOriginal[id],
        next: [x + origin[0], y + origin[1]],
      }
    })

    return entriesToMove
  }
}
