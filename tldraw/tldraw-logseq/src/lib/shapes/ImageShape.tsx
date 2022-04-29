/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { HTMLContainer, TLComponentProps } from '@tldraw/react'
import { TLImageShape, TLImageShapeProps } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import type { CustomStyleProps } from './style-props'

export interface ImageShapeProps extends TLImageShapeProps, CustomStyleProps {
  type: 'image'
  assetId: string
  opacity: number
}

export class ImageShape extends TLImageShape<ImageShapeProps> {
  static id = 'image'

  static defaultProps: ImageShapeProps = {
    id: 'image1',
    parentId: 'page',
    type: 'image',
    point: [0, 0],
    size: [100, 100],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    assetId: '',
    clipping: 0,
    objectFit: 'fill',
    isAspectRatioLocked: true,
  }

  ReactComponent = observer(({ events, isErasing, asset }: TLComponentProps) => {
    const {
      props: {
        opacity,
        objectFit,
        clipping,
        size: [w, h],
      },
    } = this

    const [t, r, b, l] = Array.isArray(clipping)
      ? clipping
      : [clipping, clipping, clipping, clipping]

    return (
      <HTMLContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {asset && (
            <img
              src={asset.src}
              draggable={false}
              style={{
                position: 'relative',
                top: -t,
                left: -l,
                width: w + (l - r),
                height: h + (t - b),
                objectFit,
                pointerEvents: 'all',
              }}
            />
          )}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
      },
    } = this
    return <rect width={w} height={h} fill="transparent" />
  })
}
