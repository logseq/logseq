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
        handles: {
          start: { id: 'start', canBind: true, point: [0, 0] },
          end: { id: 'end', canBind: true, point: [1, 1] },
        },
        stroke: 'black',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
