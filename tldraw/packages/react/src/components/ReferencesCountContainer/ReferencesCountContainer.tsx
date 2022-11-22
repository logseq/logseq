import type { TLBounds } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useApp, useRendererContext } from '../../hooks'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { HTMLContainer } from '../HTMLContainer'

export interface TLReferencesCountContainerProps<S extends TLReactShape> {
  hidden: boolean
  bounds: TLBounds
  shape: S
}

// backlinks
export const ReferencesContainer = observer(function ReferencesCountContainer<
  S extends TLReactShape
>({ bounds, hidden, shape }: TLReferencesCountContainerProps<S>) {
  const {
    viewport: {
      camera: { zoom },
    },
    components: { ReferencesCount },
  } = useRendererContext()

  const app = useApp<S>()

  if (!ReferencesCount) throw Error('Expected a ReferencesCount component.')

  const stop: React.EventHandler<any> = e => e.stopPropagation()

  const rounded = bounds.height * zoom < 50 || !app.selectedShapesArray.includes(shape)

  return (
    <Container bounds={bounds} className="tl-references-count-container">
      <HTMLContainer>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            pointerEvents: 'all',
            transformOrigin: 'left top',
            transform: 'translateY(6px) scale(var(--tl-scale))',
          }}
          onPointerDown={stop}
          onWheelCapture={stop}
          title="Shape Backlinks"
        >
          <ReferencesCount
            className={'tl-references-count ' + (rounded ? 'tl-references-count-rounded' : '')}
            id={shape.id}
            shape={shape}
          />
        </span>
      </HTMLContainer>
    </Container>
  )
})
