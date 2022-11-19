import type { TLBounds } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useRendererContext } from '../../hooks'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { HTMLContainer } from '../HTMLContainer'

export interface TLReferencesCountContainerProps<S extends TLReactShape> {
  hidden: boolean
  bounds: TLBounds
  shape: S
}

export const ReferencesCountContainer = observer(function ReferencesCountContainer<
  S extends TLReactShape
>({ bounds, hidden, shape }: TLReferencesCountContainerProps<S>) {
  const {
    components: { ReferencesCount },
  } = useRendererContext()

  if (!ReferencesCount) throw Error('Expected a ReferencesCount component.')

  const stop: React.EventHandler<any> = e => e.stopPropagation()

  return (
    <Container
      style={{
        zIndex: 20000,
      }}
      bounds={bounds}
      aria-label="references-count-container"
    >
      <HTMLContainer>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            pointerEvents: 'all',
            transformOrigin: 'left top',
            transform: 'scale(var(--tl-scale)) translateY(8px)',
          }}
          onPointerDown={stop}
          onWheelCapture={stop}
        >
          <ReferencesCount className="tl-reference-count-container" id={shape.id} shape={shape} />
        </span>
      </HTMLContainer>
    </Container>
  )
})
