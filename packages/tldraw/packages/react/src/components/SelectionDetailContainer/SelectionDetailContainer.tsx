import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { BoundsUtils } from '@tldraw/core'
import type { TLBounds } from '@tldraw/core'
import { useRendererContext, useCounterScaledPosition } from '../../hooks'
import type { TLReactShape } from '../../lib'

export interface TLSelectionDetailContainerProps<S extends TLReactShape> {
  hidden: boolean
  bounds: TLBounds
  shapes: S[]
  detail?: 'size' | 'rotation'
  rotation?: number
}

export const SelectionDetailContainer = observer(function SelectionDetail<S extends TLReactShape>({
  bounds,
  hidden,
  shapes,
  rotation = 0,
  detail = 'size',
}: TLSelectionDetailContainerProps<S>) {
  const {
    components: { SelectionDetail },
    viewport: {
      camera: { zoom },
    },
  } = useRendererContext()

  const rBounds = React.useRef<HTMLDivElement>(null)
  const scaledBounds = BoundsUtils.multiplyBounds(bounds, zoom)
  useCounterScaledPosition(rBounds, bounds, rotation, 10003)

  if (!SelectionDetail) throw Error('Expected a SelectionDetail component.')

  return (
    <div
      ref={rBounds}
      className={`tl-counter-scaled-positioned ${hidden ? `tl-fade-out` : ''}`}
      aria-label="bounds-detail-container"
      data-html2canvas-ignore="true"
    >
      <SelectionDetail
        shapes={shapes}
        bounds={bounds}
        scaledBounds={scaledBounds}
        zoom={zoom}
        rotation={rotation}
        detail={detail}
      />
    </div>
  )
})
