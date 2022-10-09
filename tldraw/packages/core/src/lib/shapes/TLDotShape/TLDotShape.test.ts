import type { TLDotShapeProps } from '.'
import { TLDotShape } from './TLDotShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface DotShapeProps extends TLDotShapeProps {
      stroke: string
    }

    class Shape extends TLDotShape<DotShapeProps> {
      static defaultProps: DotShapeProps = {
        id: 'dot',
        type: 'dot',
        parentId: 'page',
        point: [0, 0],
        radius: 4,
        stroke: 'black',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
