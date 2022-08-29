/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLEllipseShapeProps, TLEllipseShape } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface EllipseShapeProps extends TLEllipseShapeProps, CustomStyleProps {
  type: 'ellipse'
  size: number[]
}

export class EllipseShape extends TLEllipseShape<EllipseShapeProps> {
  static id = 'ellipse'

  static defaultProps: EllipseShapeProps = {
    id: 'ellipse',
    parentId: 'page',
    type: 'ellipse',
    point: [0, 0],
    size: [100, 100],
    stroke: '#000000',
    fill: 'var(--ls-secondary-background-color)',
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ isSelected, isErasing, events }: TLComponentProps) => {
    const {
      size: [w, h],
      stroke,
      fill,
      noFill,
      strokeWidth,
      strokeType,
      opacity,
    } = this.props
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <ellipse
          className={isSelected || !noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
        />
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
          strokeWidth={strokeWidth}
          stroke={noFill ? fill : stroke}
          strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
          fill={noFill ? 'none' : fill}
        />
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      size: [w, h],
    } = this.props
    return (
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} strokeWidth={2} fill="transparent" />
    )
  })

  validateProps = (props: Partial<EllipseShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(this, props)
  }

  /**
   * Get a svg group element that can be used to render the shape with only the props data. In the
   * base, draw any shape as a box. Can be overridden by subclasses.
   */
  getShapeSVGJsx(opts: any) {
    const {
      size: [w, h],
      stroke,
      fill,
      noFill,
      strokeWidth,
      strokeType,
      opacity,
    } = this.props
    return (
      <g opacity={opacity}>
        <ellipse
          className={!noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
        />
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
          strokeWidth={strokeWidth}
          stroke={noFill ? fill : stroke}
          strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
          fill={noFill ? 'none' : fill}
        />
      </g>
    )
  }
}
