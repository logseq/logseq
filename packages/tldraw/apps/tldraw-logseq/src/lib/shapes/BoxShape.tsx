/* eslint-disable @typescript-eslint/no-explicit-any */
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { TLBoxShape, TLBoxShapeProps, getComputedColor, getTextLabelSize } from '@tldraw/core'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { BindingIndicator } from './BindingIndicator'
import { TextLabel } from './text/TextLabel'
import type { SizeLevel } from '.'
import { action, computed } from 'mobx'

export interface BoxShapeProps extends TLBoxShapeProps, CustomStyleProps {
  borderRadius: number
  type: 'box'
  label: string
  fontSize: number
  fontWeight: number
  italic: boolean
  scaleLevel?: SizeLevel
}

const font = '20px / 1 var(--ls-font-family)'

const levelToScale = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60,
}

export class BoxShape extends TLBoxShape<BoxShapeProps> {
  static id = 'box'

  static defaultProps: BoxShapeProps = {
    id: 'box',
    parentId: 'page',
    type: 'box',
    point: [0, 0],
    size: [100, 100],
    borderRadius: 2,
    stroke: '',
    fill: '',
    noFill: false,
    fontWeight: 400,
    fontSize: 20,
    italic: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
    label: '',
  }

  canEdit = true

  ReactComponent = observer(
    ({ events, isErasing, isBinding, isSelected, isEditing, onEditingEnd }: TLComponentProps) => {
      const {
        props: {
          size: [w, h],
          stroke,
          fill,
          noFill,
          strokeWidth,
          strokeType,
          borderRadius,
          opacity,
          label,
          italic,
          fontWeight,
          fontSize,
        },
      } = this

      const labelSize =
        label || isEditing
          ? getTextLabelSize(
              label,
              { fontFamily: 'var(--ls-font-family)', fontSize, lineHeight: 1, fontWeight },
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
        <div
          {...events}
          style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          className="tl-box-container"
        >
          <TextLabel
            font={font}
            text={label}
            color={getComputedColor(stroke, 'text')}
            offsetX={offset[0]}
            offsetY={offset[1]}
            fontSize={fontSize}
            scale={scale}
            isEditing={isEditing}
            onChange={handleLabelChange}
            onBlur={onEditingEnd}
            fontStyle={italic ? 'italic' : 'normal'}
            fontWeight={fontWeight}
            pointerEvents={!!label}
          />
          <SVGContainer opacity={isErasing ? 0.2 : opacity}>
            {isBinding && <BindingIndicator mode="svg" strokeWidth={strokeWidth} size={[w, h]} />}
            <rect
              className={isSelected || !noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              rx={borderRadius}
              ry={borderRadius}
              width={Math.max(0.01, w - strokeWidth)}
              height={Math.max(0.01, h - strokeWidth)}
              pointerEvents="all"
            />
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              rx={borderRadius}
              ry={borderRadius}
              width={Math.max(0.01, w - strokeWidth)}
              height={Math.max(0.01, h - strokeWidth)}
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

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    this.update({
      scaleLevel: v,
      fontSize: levelToScale[v ?? 'md'],
      strokeWidth: levelToScale[v ?? 'md'] / 10,
    })
    this.onResetBounds()
  }

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
        borderRadius,
        isLocked,
      },
    } = this

    return (
      <g>
        <rect
          width={w}
          height={h}
          rx={borderRadius}
          ry={borderRadius}
          fill="transparent"
          strokeDasharray={isLocked ? '8 2' : undefined}
        />
      </g>
    )
  })

  validateProps = (props: Partial<BoxShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    if (props.borderRadius !== undefined) props.borderRadius = Math.max(0, props.borderRadius)
    return withClampedStyles(this, props)
  }
}
