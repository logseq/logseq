/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLAsset } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { Container } from '~components'
import { useShapeEvents } from '~hooks/useShapeEvents'
import type { TLReactShape } from '~lib'

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
  zIndex,
}: ShapeProps) {
  const {
    bounds,
    props: { rotation, scale },
    ReactComponent,
  } = shape
  const events = useShapeEvents(shape)
  return (
    <Container zIndex={zIndex} data-type="Shape" bounds={bounds} rotation={rotation} scale={scale}>
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
