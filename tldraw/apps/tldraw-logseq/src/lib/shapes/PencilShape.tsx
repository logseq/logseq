/* eslint-disable @typescript-eslint/no-explicit-any */
import { SvgPathUtils, TLDrawShape, TLDrawShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { computed, makeObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import getStroke, { getStrokeOutlinePoints, getStrokePoints, StrokeOptions } from 'perfect-freehand'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface PencilShapeProps extends TLDrawShapeProps, CustomStyleProps {
  type: 'pencil'
}

const simulatePressureSettings: StrokeOptions = {
  easing: t => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
}

const realPressureSettings: StrokeOptions = {
  easing: t => t * t,
  simulatePressure: false,
}

function getFreehandOptions(shape: PencilShapeProps) {
  const options: StrokeOptions = {
    size: 1 + shape.strokeWidth * 1.5,
    thinning: 0.65,
    streamline: 0.65,
    smoothing: 0.65,
    ...(shape.points[1][2] === 0.5 ? simulatePressureSettings : realPressureSettings),
    last: shape.isComplete,
  }

  return options
}

function getFillPath(shape: PencilShapeProps) {
  if (shape.points.length < 2) return ''

  return SvgPathUtils.getSvgPathFromStroke(
    getStrokePoints(shape.points, getFreehandOptions(shape)).map(pt => pt.point)
  )
}

function getDrawStrokePoints(shape: PencilShapeProps, options: StrokeOptions) {
  return getStrokePoints(shape.points, options)
}

function getDrawStrokePathTDSnapshot(shape: PencilShapeProps) {
  if (shape.points.length < 2) return ''
  const options = getFreehandOptions(shape)
  const strokePoints = getDrawStrokePoints(shape, options)
  const path = SvgPathUtils.getSvgPathFromStroke(getStrokeOutlinePoints(strokePoints, options))
  return path
}

export class PencilShape extends TLDrawShape<PencilShapeProps> {
  constructor(props = {} as Partial<PencilShapeProps>) {
    super(props)
    makeObservable(this)
  }

  static id = 'pencil'

  static defaultProps: PencilShapeProps = {
    id: 'pencil',
    parentId: 'page',
    type: 'pencil',
    point: [0, 0],
    points: [],
    isComplete: false,
    stroke: 'var(--tl-foreground, #000)',
    fill: 'var(--tl-foreground, #000)',
    noFill: true,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  @computed get pointsPath() {
    return getDrawStrokePathTDSnapshot(this.props)
  }

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const {
      props: { opacity },
    } = this
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        {this.getShapeSVGJsx()}
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const { pointsPath } = this
    return <path d={pointsPath} />
  })

  validateProps = (props: Partial<PencilShapeProps>) => {
    props = withClampedStyles(this, props)
    if (props.strokeWidth !== undefined) props.strokeWidth = Math.max(props.strokeWidth, 1)
    return props
  }

  getShapeSVGJsx() {
    const {
      pointsPath,
      props: { stroke, noFill, strokeWidth, strokeType },
    } = this
    return (
      <path
        d={pointsPath}
        strokeWidth={strokeWidth}
        stroke={stroke}
        fill={stroke}
        pointerEvents="all"
        strokeDasharray={strokeType === 'dashed' ? '12 4' : undefined}
      />
    )
  }
}
