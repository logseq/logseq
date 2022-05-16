import type { TLImageShapeProps } from '.'
import { TLImageShape } from './TLImageShape'

describe('A minimal test', () => {
  it('Creates the shape', () => {
    interface ImageShapeProps extends TLImageShapeProps {
      stroke: string
    }

    class Shape extends TLImageShape<ImageShapeProps> {
      static defaultProps: ImageShapeProps = {
        id: 'image',
        type: 'image',
        parentId: 'page',
        point: [0, 0],
        size: [100, 100],
        stroke: 'black',
        clipping: 0,
        objectFit: 'none',
        assetId: '',
      }
    }

    const shape = new Shape()
    expect(shape).toBeDefined()
    expect(shape.props.stroke).toBe('black')
  })
})
