/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { Container, SVGContainer } from '~components'
import type { TLReactShape } from '~lib'

interface IndicatorProps {
  shape: TLReactShape
  isHovered?: boolean
  isSelected?: boolean
  isBinding?: boolean
  isEditing?: boolean
  isActivated?: boolean
  meta?: any
}

export const Indicator = observer(function Shape({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isEditing = false,
  isActivated = false,
  meta,
}: IndicatorProps) {
  const {
    bounds,

    props: { scale, rotation = 0 },
    ReactIndicator,
  } = shape

  return (
    <Container bounds={bounds} rotation={rotation} scale={scale} zIndex={10000}>
      <SVGContainer>
        <g
          className={`tl-indicator-container ${
            isSelected || isActivated ? 'tl-selected' : 'tl-hovered'
          }`}
        >
          <ReactIndicator
            isActivated={isActivated}
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
