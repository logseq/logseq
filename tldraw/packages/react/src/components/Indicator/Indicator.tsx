/* eslint-disable @typescript-eslint/no-explicit-any */
import { observer } from 'mobx-react-lite'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { SVGContainer } from '../SVGContainer'

interface IndicatorProps {
  shape: TLReactShape
  isHovered?: boolean
  isSelected?: boolean
  isBinding?: boolean
  isEditing?: boolean
  meta?: any
}

export const Indicator = observer(function Shape({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isEditing = false,
  meta,
}: IndicatorProps) {
  const {
    bounds,

    props: { scale, rotation = 0 },
    ReactIndicator,
  } = shape

  return (
    <Container
      data-type="Indicator"
      data-html2canvas-ignore="true"
      bounds={bounds}
      rotation={rotation}
      scale={scale}
      zIndex={isEditing ? 1000 : 10000}
    >
      <SVGContainer>
        <g className={`tl-indicator-container ${isSelected ? 'tl-selected' : 'tl-hovered'}`}>
          <ReactIndicator
            isEditing={isEditing}
            isBinding={isBinding}
            isHovered={isHovered}
            isSelected={isSelected}
            isErasing={false}
            meta={meta}
          />
        </g>
      </SVGContainer>
    </Container>
  )
})
