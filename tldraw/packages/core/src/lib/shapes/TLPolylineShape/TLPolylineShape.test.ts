import { TLPolylineShapeProps, TLPolylineShape } from './TLPolylineShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface PolylineShapeProps extends TLPolylineShapeProps {
      stroke: string
    }

    class Shape extends TLPolylineShape<PolylineShapeProps> {
      static defaultProps: PolylineShapeProps = {
        id: 'dot',
        type: 'dot',
        parentId: 'page',
        point: [0, 0],
        handles: [
          { id: 'start', point: [0, 0] },
          { id: 'end', point: [0, 0] },
        ],
        stroke: 'black',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
