import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useBoundsEvents } from '~hooks/useBoundsEvents'
import { SVGContainer } from '~components'
import type { TLReactShape } from '~lib'
import type { TLSelectionComponentProps } from '~types/component-props'

export const SelectionBackground = observer(function SelectionBackground<S extends TLReactShape>({
  bounds,
}: TLSelectionComponentProps<S>) {
  const events = useBoundsEvents('background')

  return (
    <SVGContainer {...events}>
      <rect
        className="tl-bounds-bg"
        width={Math.max(1, bounds.width)}
        height={Math.max(1, bounds.height)}
        pointerEvents="all"
      />
    </SVGContainer>
  )
})
