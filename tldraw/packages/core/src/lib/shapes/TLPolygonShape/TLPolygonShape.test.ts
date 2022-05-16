import type { TLPolygonShapeProps } from '.'
import { TLPolygonShape } from './TLPolygonShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface PolygonShapeProps extends TLPolygonShapeProps {
      stroke: string
    }

    class Shape extends TLPolygonShape<PolygonShapeProps> {
      static defaultProps: PolygonShapeProps = {
        id: 'dot',
        type: 'dot',
        parentId: 'page',
        point: [0, 0],
        size: [100, 100],
        sides: 3,
        ratio: 0.5,
        isFlippedY: false,
        stroke: 'black',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
