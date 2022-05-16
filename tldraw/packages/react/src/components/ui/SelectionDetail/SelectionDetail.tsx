/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { HTMLContainer } from '~components'
import { TAU } from '~constants'
import { GeomUtils } from '@tldraw/core'
import type { TLReactShape } from '~lib'
import type { TLSelectionDetailProps } from '~types/component-props'
import Vec from '@tldraw/vec'

export const SelectionDetail = observer(function SelectionDetail<S extends TLReactShape>({
  bounds,
  shapes,
  scaledBounds,
  detail = 'size',
  rotation = 0,
}: TLSelectionDetailProps<S>) {
  // This is the actual rotation of the bounding box, used to position the detail. Note that when rotating only one shape, the bounds rotation and the rotation shown in the detail will be the same; however, when rotating more than one shape, the bounding box will be axis-aligned, but the detail will show the angle that the bounds has been rotated by.
  const selectionRotation = shapes.length === 1 ? rotation : bounds.rotation ?? 0
  const isFlipped = !(selectionRotation < TAU || selectionRotation > TAU * 3)
  const isLine = shapes.length === 1 && shapes[0].type === 'line'

  return (
    <HTMLContainer centered>
      <div
        className="tl-bounds-detail"
        style={{
          transform: isFlipped
            ? `rotate(${Math.PI + selectionRotation}rad) translateY(${
                scaledBounds.height / 2 + 32
              }px)`
            : `rotate(${selectionRotation}rad) translateY(${scaledBounds.height / 2 + 24}px)`,
          padding: '2px 3px',
          borderRadius: '1px',
        }}
      >
        {isLine
          ? `${Vec.dist(
              shapes[0].props.handles![0].point,
              shapes[0].props.handles![1].point
            ).toFixed()}`
          : detail === 'size'
          ? `${bounds.width.toFixed()} × ${bounds.height.toFixed()}`
          : `∠${GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed()}°`}
      </div>
    </HTMLContainer>
  )
})
