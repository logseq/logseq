/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TLEllipseShapeProps,
  TLEllipseShape,
  getComputedColor,
  getTextLabelSize,
} from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextLabel } from './text/TextLabel'
export interface EllipseShapeProps extends TLEllipseShapeProps, CustomStyleProps {
  type: 'ellipse'
  size: number[]
  label: string
  fontWeight: number
  italic: boolean
}

const font = '18px / 1 var(--ls-font-family)'

export class EllipseShape extends TLEllipseShape<EllipseShapeProps> {
  static id = 'ellipse'

  static defaultProps: EllipseShapeProps = {
    id: 'ellipse',
    parentId: 'page',
    type: 'ellipse',
    point: [0, 0],
    size: [100, 100],
    stroke: '',
    fill: '',
    noFill: false,
    fontWeight: 400,
    italic: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
    label: '',
  }

  canEdit = true

  ReactComponent = observer(
    ({ isSelected, isErasing, events, isEditing, onEditingEnd }: TLComponentProps) => {
      const {
        size: [w, h],
        stroke,
        fill,
        noFill,
        strokeWidth,
        strokeType,
        opacity,
        label,
        italic,
        fontWeight,
      } = this.props

      const labelSize =
        label || isEditing
          ? getTextLabelSize(
              label,
              { fontFamily: 'var(--ls-font-family)', fontSize: 18, lineHeight: 1, fontWeight },
              4
            )
          : [0, 0]
      const midPoint = Vec.mul(this.props.size, 0.5)
      const scale = Math.max(0.5, Math.min(1, w / labelSize[0], h / labelSize[1]))
      const bounds = this.getBounds()

      const offset = React.useMemo(() => {
        return Vec.sub(midPoint, Vec.toFixed([bounds.width / 2, bounds.height / 2]))
      }, [bounds, scale, midPoint])

      const handleLabelChange = React.useCallback(
        (label: string) => {
          this.update?.({ label })
        },
        [label]
      )

      return (
        <div {...events} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <TextLabel
            font={font}
            text={label}
            color={getComputedColor(stroke, 'text')}
            offsetX={offset[0]}
            offsetY={offset[1]}
            scale={scale}
            isEditing={isEditing}
            onChange={handleLabelChange}
            onBlur={onEditingEnd}
            fontStyle={italic ? 'italic' : 'normal'}
            fontWeight={fontWeight}
          />
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
              stroke={getComputedColor(stroke, 'stroke')}
              strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
              fill={noFill ? 'none' : getComputedColor(fill, 'background')}
            />
          </SVGContainer>
        </div>
      )
    }
  )

  ReactIndicator = observer(() => {
    const {
      size: [w, h]
    } = this.props

    return (
      <g>
        <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} strokeWidth={2} fill="transparent" />
      </g>
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
          stroke={getComputedColor(stroke, 'stroke')}
          strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
          fill={noFill ? 'none' : getComputedColor(fill, 'background')}
        />
      </g>
    )
  }
}
