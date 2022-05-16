import type { TLEllipseShapeProps } from '.'
import { TLEllipseShape } from './TLEllipseShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface EllipseShapeProps extends TLEllipseShapeProps {
      stroke: string
    }

    class Shape extends TLEllipseShape<EllipseShapeProps> {
      static defaultProps: EllipseShapeProps = {
        id: 'ellipse',
        type: 'ellipse',
        parentId: 'page',
        point: [0, 0],
        size: [100, 100],
        stroke: 'black',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
