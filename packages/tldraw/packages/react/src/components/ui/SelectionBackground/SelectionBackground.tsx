import { observer } from 'mobx-react-lite'
import { useBoundsEvents } from '../../../hooks'
import type { TLReactShape } from '../../../lib'
import type { TLSelectionComponentProps } from '../../../types'
import { SVGContainer } from '../../SVGContainer'

export const SelectionBackground = observer(function SelectionBackground<S extends TLReactShape>({
  bounds,
}: TLSelectionComponentProps<S>) {
  const events = useBoundsEvents('background')

  return (
    <SVGContainer data-html2canvas-ignore="true" {...events}>
      <rect
        className="tl-bounds-bg"
        width={Math.max(1, bounds.width)}
        height={Math.max(1, bounds.height)}
        pointerEvents="all"
        rx={8}
        ry={8}
      />
    </SVGContainer>
  )
})
