/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  intersectLineSegmentBounds,
  intersectLineSegmentPolyline,
  intersectPolygonBounds,
} from '@tldraw/intersect'
import Vec from '@tldraw/vec'
import { action, computed, makeObservable, observable, toJS } from 'mobx'
import type { TLHandle, TLBounds, TLResizeEdge, TLResizeCorner, TLAsset } from '~types'
import { deepCopy, BoundsUtils, PointUtils } from '~utils'

export type TLShapeModel<P extends TLShapeProps = TLShapeProps> = {
  nonce?: number
} & Partial<P> & { id: string; type: P['type'] }

export interface TLShapeConstructor<S extends TLShape = TLShape> {
  new (props: any): S
  id: string
}

export type TLFlag = boolean | (() => boolean)

export interface TLShapeProps {
  id: string
  type: any
  parentId: string
  name?: string
  point: number[]
  scale?: number[]
  rotation?: number
  handles?: TLHandle[]
  label?: string
  labelPosition?: number[]
  clipping?: number | number[]
  assetId?: string
  children?: string[]
  isGhost?: boolean
  isHidden?: boolean
  isLocked?: boolean
  isGenerated?: boolean
  isSizeLocked?: boolean
  isAspectRatioLocked?: boolean
}

export interface TLResizeStartInfo {
  isSingle: boolean
}

export interface TLResizeInfo {
  bounds: TLBounds
  center: number[]
  rotation: number
  type: TLResizeEdge | TLResizeCorner
  clip: boolean
  scale: number[]
  transformOrigin: number[]
}

export interface TLResetBoundsInfo<T extends TLAsset> {
  asset?: T
}

export interface TLHandleChangeInfo {
  index: number
  delta: number[]
}

export abstract class TLShape<P extends TLShapeProps = TLShapeProps, M = any> {
  constructor(props: Partial<P>) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const type = this.constructor['id']
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const defaultProps = this.constructor['defaultProps'] ?? {}
    this.type = type
    this.props = { scale: [1, 1], ...defaultProps, ...props }
    makeObservable(this)
  }

  static type: string

  @observable props: P
  aspectRatio?: number
  type: string
  // Display options
  hideCloneHandles = false
  hideResizeHandles = false
  hideRotateHandle = false
  hideContextBar = false
  hideSelectionDetail = false
  hideSelection = false
  // Behavior options
  canChangeAspectRatio: TLFlag = true
  canUnmount: TLFlag = true
  canResize: TLFlag = true
  canScale: TLFlag = true
  canFlip: TLFlag = true
  canEdit: TLFlag = false
  nonce = 0
  private isDirty = false
  private lastSerialized = {} as TLShapeModel<P>

  abstract getBounds: () => TLBounds

  @computed get id() {
    return this.props.id
  }

  getCenter = () => {
    return BoundsUtils.getBoundsCenter(this.bounds)
  }

  getRotatedBounds = () => {
    const {
      bounds,
      props: { rotation },
    } = this
    if (!rotation) return bounds
    return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(bounds, rotation))
  }

  hitTestPoint = (point: number[]): boolean => {
    const ownBounds = this.rotatedBounds
    if (!this.props.rotation) {
      return PointUtils.pointInBounds(point, ownBounds)
    }
    const corners = BoundsUtils.getRotatedCorners(ownBounds, this.props.rotation)
    return PointUtils.pointInPolygon(point, corners)
  }

  hitTestLineSegment = (A: number[], B: number[]): boolean => {
    const box = BoundsUtils.getBoundsFromPoints([A, B])
    const {
      rotatedBounds,
      props: { rotation = 0 },
    } = this
    return BoundsUtils.boundsContain(rotatedBounds, box) || rotation
      ? intersectLineSegmentPolyline(A, B, BoundsUtils.getRotatedCorners(this.bounds)).didIntersect
      : intersectLineSegmentBounds(A, B, rotatedBounds).length > 0
  }

  hitTestBounds = (bounds: TLBounds): boolean => {
    const {
      rotatedBounds,
      props: { rotation = 0 },
    } = this
    const corners = BoundsUtils.getRotatedCorners(this.bounds, rotation)
    return (
      BoundsUtils.boundsContain(bounds, rotatedBounds) ||
      intersectPolygonBounds(corners, bounds).length > 0
    )
  }

  @computed get center(): number[] {
    return this.getCenter()
  }

  @computed get bounds(): TLBounds {
    return this.getBounds()
  }

  @computed get rotatedBounds(): TLBounds {
    return this.getRotatedBounds()
  }

  getSerialized = (): TLShapeModel<P> => {
    return toJS({ ...this.props, type: this.type, nonce: this.nonce } as TLShapeModel<P>)
  }

  protected getCachedSerialized = (): TLShapeModel<P> => {
    if (this.isDirty || Object.keys(this.lastSerialized).length === 0) {
      this.nonce++
      this.isDirty = false
      this.lastSerialized = this.getSerialized()
    }
    return this.lastSerialized
  }

  get serialized(): TLShapeModel<P> {
    return this.getCachedSerialized()
  }

  validateProps = (
    props: Partial<TLShapeProps> & Partial<P>
  ): Partial<TLShapeProps> & Partial<P> => {
    return props
  }

  @action update = (props: Partial<TLShapeProps & P & any>, isDeserializing = false) => {
    if (!(isDeserializing || this.isDirty)) this.isDirty = true
    Object.assign(this.props, this.validateProps(props as Partial<TLShapeProps> & Partial<P>))
    return this
  }

  clone = (): this => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new this.constructor(this.serialized)
  }

  onResetBounds = (info: TLResetBoundsInfo<any>) => {
    return this
  }

  protected scale: number[] = [1, 1]

  onResizeStart = (info: TLResizeStartInfo) => {
    this.scale = [...(this.props.scale ?? [1, 1])]
    return this
  }

  onResize = (initialProps: TLShapeModel<P>, info: TLResizeInfo) => {
    const {
      bounds,
      rotation,
      scale: [scaleX, scaleY],
    } = info
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1
    this.update({ point: [bounds.minX, bounds.minY], scale: nextScale, rotation })
    return this
  }

  onHandleChange = (initialShape: any, { index, delta }: TLHandleChangeInfo) => {
    if (initialShape.handles === undefined) return
    const nextHandles = [...initialShape.handles]
    nextHandles[index] = {
      ...nextHandles[index],
      point: Vec.add(delta, initialShape.handles[index].point),
    }
    const topLeft = BoundsUtils.getCommonTopLeft(nextHandles.map(h => h.point))
    this.update({
      point: Vec.add(initialShape.point, topLeft),
      handles: nextHandles.map(h => ({ ...h, point: Vec.sub(h.point, topLeft) })),
    })
  }
}
