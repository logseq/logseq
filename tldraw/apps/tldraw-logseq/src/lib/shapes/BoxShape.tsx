/* eslint-disable @typescript-eslint/no-explicit-any */
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { BindingIndicator } from './BindingIndicator'

export interface BoxShapeProps extends TLBoxShapeProps, CustomStyleProps {
  borderRadius: number
  type: 'box'
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
    stroke: '#000000',
    fill: 'var(--ls-secondary-background-color)',
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing, isBinding, isSelected }: TLComponentProps) => {
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
      },
    } = this

    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
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
          stroke={noFill ? fill : stroke}
          strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
          fill={noFill ? 'none' : fill}
        />
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
        borderRadius,
      },
    } = this
    return <rect width={w} height={h} rx={borderRadius} ry={borderRadius} fill="transparent" />
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
