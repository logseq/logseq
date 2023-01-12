import type { TLDrawShapeProps } from '.'
import { TLDrawShape } from './TLDrawShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface DrawShapeProps extends TLDrawShapeProps {
      stroke: string
    }

    class DrawShape extends TLDrawShape<DrawShapeProps> {
      static defaultProps: DrawShapeProps = {
        id: 'draw',
        type: 'draw',
        parentId: 'page',
        point: [0, 0],
        points: [
          [0, 0],
          [1, 1],
        ],
        isComplete: false,
        stroke: 'black',
      }
    }

    const shape = new DrawShape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
