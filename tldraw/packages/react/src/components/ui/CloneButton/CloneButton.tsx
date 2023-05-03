import { observer } from 'mobx-react-lite'
import type { TLReactShape } from '../../../lib'
import type { TLCloneButtonComponentProps } from '../../../types'

export const CloneButton = observer(function Handle<S extends TLReactShape>({
  shape,
  direction,
}: TLCloneButtonComponentProps<S>) {

  return (
    <g className="tl-clone-button" aria-label="handle"  transform={`translate()`}>
    </g>
  )
})
