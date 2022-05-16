/* eslint-disable @typescript-eslint/no-explicit-any */
import { action, observable, makeObservable, computed, observe } from 'mobx'
import { TLBinding, TLEventMap, TLResizeCorner } from '~types'
import type { TLApp, TLShape, TLShapeModel } from '~lib'
import { BoundsUtils } from '~utils'

export interface TLPageModel<S extends TLShape = TLShape> {
  id: string
  name: string
  shapes: TLShapeModel<S['props']>[]
  bindings: TLBinding[]
  nonce?: number
}

export interface TLPageProps<S> {
  id: string
  name: string
  shapes: S[]
  bindings: TLBinding[]
}

export class TLPage<S extends TLShape = TLShape, E extends TLEventMap = TLEventMap> {
  constructor(app: TLApp<S, E>, props = {} as TLPageProps<S>) {
    const { id, name, shapes = [], bindings = [] } = props
    this.id = id
    this.name = name
    this.bindings = bindings
    this.app = app
    this.addShapes(...shapes)
    makeObservable(this)
  }

  app: TLApp<S, E>

  @observable id: string

  @observable name: string

  @observable shapes: S[] = []

  @observable bindings: TLBinding[]

  @computed get serialized(): TLPageModel<S> {
    return {
      id: this.id,
      name: this.name,
      shapes: this.shapes.map(shape => shape.serialized),
      bindings: this.bindings.map(binding => ({ ...binding })),
      nonce: this.nonce,
    }
  }

  nonce = 0

  private bump = () => {
    this.nonce++
  }

  @action update(props: Partial<TLPageProps<S>>) {
    Object.assign(this, props)
    return this
  }

  @action addShapes(...shapes: S[] | TLShapeModel[]) {
    if (shapes.length === 0) return
    const shapeInstances =
      'getBounds' in shapes[0]
        ? (shapes as S[])
        : (shapes as TLShapeModel[]).map(shape => {
            const ShapeClass = this.app.getShapeClass(shape.type)
            return new ShapeClass(shape)
          })
    shapeInstances.forEach(instance => observe(instance, this.app.saveState))
    this.shapes.push(...shapeInstances)
    this.bump()
    this.app.saveState()
    return shapeInstances
  }

  private parseShapesArg<S>(shapes: S[] | string[]) {
    if (typeof shapes[0] === 'string') {
      return this.shapes.filter(shape => (shapes as string[]).includes(shape.id))
    } else {
      return shapes as S[]
    }
  }

  @action removeShapes(...shapes: S[] | string[]) {
    const shapeInstances = this.parseShapesArg(shapes)
    this.shapes = this.shapes.filter(shape => !shapeInstances.includes(shape))
    return shapeInstances
  }

  @action bringForward = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    shapesToMove
      .sort((a, b) => this.shapes.indexOf(b) - this.shapes.indexOf(a))
      .map(shape => this.shapes.indexOf(shape))
      .forEach(index => {
        if (index === this.shapes.length - 1) return
        const next = this.shapes[index + 1]
        if (shapesToMove.includes(next)) return
        const t = this.shapes[index]
        this.shapes[index] = this.shapes[index + 1]
        this.shapes[index + 1] = t
      })
    return this
  }

  @action sendBackward = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    shapesToMove
      .sort((a, b) => this.shapes.indexOf(a) - this.shapes.indexOf(b))
      .map(shape => this.shapes.indexOf(shape))
      .forEach(index => {
        if (index === 0) return
        const next = this.shapes[index - 1]
        if (shapesToMove.includes(next)) return
        const t = this.shapes[index]
        this.shapes[index] = this.shapes[index - 1]
        this.shapes[index - 1] = t
      })
    return this
  }

  @action bringToFront = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    this.shapes = this.shapes.filter(shape => !shapesToMove.includes(shape)).concat(shapesToMove)
    return this
  }

  @action sendToBack = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    this.shapes = shapesToMove.concat(this.shapes.filter(shape => !shapesToMove.includes(shape)))
    return this
  }

  flip = (shapes: S[] | string[], direction: 'horizontal' | 'vertical'): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    const commonBounds = BoundsUtils.getCommonBounds(shapesToMove.map(shape => shape.bounds))
    shapesToMove.forEach(shape => {
      const relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(
        commonBounds,
        commonBounds,
        shape.bounds,
        direction === 'horizontal',
        direction === 'vertical'
      )
      shape.onResize(shape.serialized, {
        bounds: relativeBounds,
        center: BoundsUtils.getBoundsCenter(relativeBounds),
        rotation: shape.props.rotation ?? 0 * -1,
        type: TLResizeCorner.TopLeft,
        scale:
          shape.canFlip && shape.props.scale
            ? direction === 'horizontal'
              ? [-shape.props.scale[0], 1]
              : [1, -shape.props.scale[1]]
            : [1, 1],
        clip: false,
        transformOrigin: [0.5, 0.5],
      })
    })
    return this
  }
}
