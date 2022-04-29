/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLPolylineShape, TLPolylineShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'

interface PolylineShapeProps extends CustomStyleProps, TLPolylineShapeProps {
  type: 'polyline'
}

export class PolylineShape extends TLPolylineShape<PolylineShapeProps> {
  hideSelection = true

  static id = 'polyline'

  static defaultProps: PolylineShapeProps = {
    id: 'box',
    parentId: 'page',
    type: 'polyline',
    point: [0, 0],
    handles: [],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const {
      points,
      props: { stroke, strokeWidth, opacity },
    } = this
    const path = points.join()
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <g>
          <polyline className={'tl-hitarea-stroke'} points={path} />
          <polyline
            points={path}
            stroke={stroke}
            fill={'none'}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </g>
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const { points } = this
    const path = points.join()
    return <polyline points={path} />
  })

  validateProps = (props: Partial<PolylineShapeProps>) => {
    return withClampedStyles(props)
  }
}
