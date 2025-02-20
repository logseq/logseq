import type { TLBoxShapeProps } from '.'
import { TLBoxShape } from './TLBoxShape'

export interface BoxShapeProps extends TLBoxShapeProps {
  stroke: string
}

export class BoxShape extends TLBoxShape<BoxShapeProps> {
  static defaultProps: BoxShapeProps = {
    id: 'box',
    parentId: 'page',
    type: 'box',
    point: [0, 0],
    size: [100, 100],
    stroke: 'black',
  }
}

describe('A minimal test', () => {
  it('Creates the shape', () => {
    const shape = new BoxShape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
