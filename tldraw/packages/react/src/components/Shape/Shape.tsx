/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { Container } from '~components'
import type { TLReactShape } from '~lib'
import { useShapeEvents } from '~hooks/useShapeEvents'
import { useApp } from '~hooks'
import type { TLAsset } from '@tldraw/core'

interface ShapeProps {
  shape: TLReactShape
  asset?: TLAsset
  zIndex: number
  isHovered?: boolean
  isSelected?: boolean
  isBinding?: boolean
  isErasing?: boolean
  isActivated?: boolean
  isEditing?: boolean
  onEditingEnd: () => void
  meta: any
}

export const Shape = observer(function Shape({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isErasing = false,
  isEditing = false,
  isActivated = false,
  onEditingEnd,
  asset,
  meta,
}: ShapeProps) {
  const {
    bounds,
    props: { rotation, scale },
    ReactComponent,
  } = shape
  const events = useShapeEvents(shape)
  // const app = useApp()
  // let linkButton = null
  // if (shape.serialized.logseqLink) {
  //   const f = () => app.pubEvent('whiteboard-go-to-link', shape.serialized.logseqLink)
  //   linkButton = <a onMouseDown={f}>Go to Link</a>
  // }
  return (
    <Container bounds={bounds} rotation={rotation} scale={scale}>
      <ReactComponent
        meta={meta}
        isEditing={isEditing}
        isBinding={isBinding}
        isHovered={isHovered}
        isSelected={isSelected}
        isErasing={isErasing}
        isActivated={isActivated}
        events={events}
        asset={asset}
        onEditingEnd={onEditingEnd}
      />
    </Container>
  )
})
