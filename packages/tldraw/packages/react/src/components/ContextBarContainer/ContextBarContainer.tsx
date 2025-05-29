import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { TLBounds, BoundsUtils, TLOffset } from '@tldraw/core'
import { useRendererContext, useCounterScaledPosition } from '../../hooks'
import type { TLReactShape } from '../../lib'

export interface TLContextBarContainerProps<S extends TLReactShape> {
  shapes: S[]
  hidden: boolean
  bounds: TLBounds
  rotation?: number
}

export const ContextBarContainer = observer(function ContextBarContainer<S extends TLReactShape>({
  shapes,
  hidden,
  bounds,
  rotation = 0,
}: TLContextBarContainerProps<S>) {
  const {
    components: { ContextBar },
    viewport: {
      bounds: vpBounds,
      camera: {
        point: [x, y],
        zoom,
      },
    },
  } = useRendererContext()
  const rBounds = React.useRef<HTMLDivElement>(null)

  const rotatedBounds = BoundsUtils.getRotatedBounds(bounds, rotation)
  const scaledBounds = BoundsUtils.multiplyBounds(rotatedBounds, zoom)

  useCounterScaledPosition(rBounds, bounds, rotation, 10005)

  if (!ContextBar) throw Error('Expected a ContextBar component.')

  const screenBounds = BoundsUtils.translateBounds(scaledBounds, [x * zoom, y * zoom])

  const offsets: TLOffset = {
    left: screenBounds.minX,
    right: vpBounds.width - screenBounds.maxX,
    top: screenBounds.minY,
    bottom: vpBounds.height - screenBounds.maxY,
    width: screenBounds.width,
    height: screenBounds.height,
  }

  return (
    <div
      ref={rBounds}
      className="tl-counter-scaled-positioned"
      aria-label="context-bar-container"
      data-html2canvas-ignore="true"
    >
      <ContextBar
        hidden={hidden}
        shapes={shapes}
        bounds={bounds}
        offsets={offsets}
        scaledBounds={scaledBounds}
        rotation={rotation}
      />
    </div>
  )
})
