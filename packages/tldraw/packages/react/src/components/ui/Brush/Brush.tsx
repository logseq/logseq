import { observer } from 'mobx-react-lite'
import type { TLBrushProps } from '../../../types'
import { Container } from '../../Container'
import { SVGContainer } from '../../SVGContainer'

export const Brush = observer(function Brush({ bounds }: TLBrushProps) {
  return (
    <Container bounds={bounds} zIndex={10001}>
      <SVGContainer>
        <rect className="tl-brush" x={0} y={0} width={bounds.width} height={bounds.height} />
      </SVGContainer>
    </Container>
  )
})
