import type { TLTextShapeProps } from '.'
import { TLTextShape } from './TLTextShape'

export interface TextShapeProps extends TLTextShapeProps {
  stroke: string
}

export class TextShape extends TLTextShape<TextShapeProps> {
  static defaultProps: TextShapeProps = {
    id: 'text',
    type: 'text',
    parentId: 'page',
    point: [0, 0],
    text: 'hello world',
    stroke: 'black',
  }
}

describe('A minimal test', () => {
  it('Creates the shape', () => {
    const shape = new TextShape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
