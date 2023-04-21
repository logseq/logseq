import type { TLBounds } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useApp, useRendererContext } from '../../hooks'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { HTMLContainer } from '../HTMLContainer'

export interface TLBacklinksCountContainerProps<S extends TLReactShape> {
  hidden: boolean
  bounds: TLBounds
  shape: S
}

// backlinks
export const BacklinksCountContainer = observer(function BacklinksCountContainer<
  S extends TLReactShape
>({ bounds, shape }: TLBacklinksCountContainerProps<S>) {
  const {
    viewport: {
      camera: { zoom },
    },
    components: { BacklinksCount },
  } = useRendererContext()

  const app = useApp<S>()

  if (!BacklinksCount) throw Error('Expected a BacklinksCount component.')

  const stop: React.EventHandler<any> = e => e.stopPropagation()

  const rounded =
    bounds.height * zoom < 50 || !app.selectedShapesArray.includes(shape) || shape.hideSelection

  return (
    <Container bounds={bounds} className="tl-backlinks-count-container">
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
          onKeyDown={stop}
          title="Shape Backlinks"
        >
          <BacklinksCount
            className={'tl-backlinks-count ' + (rounded ? 'tl-backlinks-count-rounded' : '')}
            id={shape.id}
            shape={shape}
          />
        </span>
      </HTMLContainer>
    </Container>
  )
})
