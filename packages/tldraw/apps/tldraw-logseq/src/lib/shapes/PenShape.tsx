/* eslint-disable @typescript-eslint/no-explicit-any */
import { getStroke } from 'perfect-freehand'
import { SvgPathUtils, TLDrawShape, TLDrawShapeProps, getComputedColor } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { computed, makeObservable } from 'mobx'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface PenShapeProps extends TLDrawShapeProps, CustomStyleProps {
  type: 'pen'
}

export class PenShape extends TLDrawShape<PenShapeProps> {
  constructor(props = {} as Partial<PenShapeProps>) {
    super(props)
    makeObservable(this)
  }

  static id = 'pen'

  static defaultProps: PenShapeProps = {
    id: 'pen',
    parentId: 'page',
    type: 'pen',
    point: [0, 0],
    points: [],
    isComplete: false,
    stroke: '',
    fill: '',
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  @computed get pointsPath() {
    const {
      props: { points, isComplete, strokeWidth },
    } = this
    if (points.length < 2) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`
    }
    const stroke = getStroke(points, { size: 4 + strokeWidth * 2, last: isComplete })
    return SvgPathUtils.getCurvedPathForPolygon(stroke)
  }

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const {
      pointsPath,
      props: { stroke, strokeWidth, opacity },
    } = this
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <path
          d={pointsPath}
          strokeWidth={strokeWidth}
          stroke={getComputedColor(stroke, 'stroke')}
          fill={getComputedColor(stroke, 'stroke')}
          pointerEvents="all"
        />
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const { pointsPath } = this
    return <path d={pointsPath} strokeDasharray={this.props.isLocked ? '8 2' : 'undefined'} />
  })

  validateProps = (props: Partial<PenShapeProps>) => {
    props = withClampedStyles(this, props)
    if (props.strokeWidth !== undefined) props.strokeWidth = Math.max(props.strokeWidth, 1)
    return props
  }
}
