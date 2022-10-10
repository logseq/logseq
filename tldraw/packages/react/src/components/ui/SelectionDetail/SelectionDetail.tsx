/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { GeomUtils, TAU } from '@tldraw/core'
import Vec from '@tldraw/vec'
import type { TLReactShape } from '../../../lib'
import type { TLSelectionDetailProps } from '../../../types'
import { HTMLContainer } from '../../HTMLContainer'

export const SelectionDetail = observer(function SelectionDetail<S extends TLReactShape>({
  scaledBounds,
  shapes,
  detail = 'size',
  rotation = 0,
}: TLSelectionDetailProps<S>) {
  // This is the actual rotation of the bounding box, used to position the detail. Note that when rotating only one shape, the bounds rotation and the rotation shown in the detail will be the same; however, when rotating more than one shape, the bounding box will be axis-aligned, but the detail will show the angle that the bounds has been rotated by.
  const selectionRotation = shapes.length === 1 ? rotation : scaledBounds.rotation ?? 0
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
              shapes[0].props.handles!.start.point,
              shapes[0].props.handles!.end.point
            ).toFixed()}`
          : detail === 'size'
          ? `${scaledBounds.width.toFixed()} × ${scaledBounds.height.toFixed()}`
          : `∠${GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed()}°`}
      </div>
    </HTMLContainer>
  )
})
