import type { TLLineShapeProps } from '.'
import { TLLineShape } from './TLLineShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface LineShapeProps extends TLLineShapeProps {
      stroke: string
    }

    class Shape extends TLLineShape<LineShapeProps> {
      static defaultProps: LineShapeProps = {
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
