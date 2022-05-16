import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useHandleEvents } from '~hooks'
import type { TLReactShape } from '~lib'
import type { TLHandle } from '@tldraw/core'
import type { TLHandleComponentProps } from '~types'

export const Handle = observer(function Handle<S extends TLReactShape, H extends TLHandle>({
  shape,
  handle,
  index,
}: TLHandleComponentProps<S, H>) {
  const events = useHandleEvents(shape, index)
  const [x, y] = handle.point

  return (
    <g className="tl-handle" aria-label="handle" {...events} transform={`translate(${x}, ${y})`}>
      <circle className="tl-handle-bg" pointerEvents="all" />
      <circle className="tl-counter-scaled tl-handle" pointerEvents="none" r={4} />
    </g>
  )
})
