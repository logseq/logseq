import type { TLBounds } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useApp, useRendererContext } from '../../hooks'
import { useShapeEvents } from '../../hooks/useShapeEvents'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { HTMLContainer } from '../HTMLContainer'

export interface TLCloneButtonsContainerProps<S extends TLReactShape> {
  hidden: boolean
  bounds: TLBounds
  shape: S
}

// backlinks
export const CloneButtonsContainer = observer(function CloneButtonsContainer<S extends TLReactShape>({
  bounds,
  shape,
}: TLCloneButtonsContainerProps<S>) {
  const {
    viewport: {
      camera: { zoom },
    },
    components: { CloneButton },
  } = useRendererContext()

  const app = useApp<S>()

  const events = useShapeEvents(shape)

  if (!CloneButton) throw Error('Expected a QuickLinks component.')

  const stop: React.EventHandler<any> = e => e.stopPropagation()

  const rounded = bounds.height * zoom < 50 || !app.selectedShapesArray.includes(shape)

  return (
    <Container bounds={bounds} className="tl-quick-links-container" data-html2canvas-ignore="true">
      <HTMLContainer>
        <span
          style={{
            position: 'absolute',
            top: '100%',
            pointerEvents: 'all',
            transformOrigin: 'left top',
            paddingTop: '8px',
            // anti-scale the container so that it always show in 100% for the user
            transform: 'scale(var(--tl-scale))',
            // Make it a little bit easier to click
            minWidth: '320px',
          }}
          {...events}
          onPointerDown={stop}
        >
          <CloneButton
            direction={"left"}
            shape={shape}
          />
        </span>
      </HTMLContainer>
    </Container>
  )
})
