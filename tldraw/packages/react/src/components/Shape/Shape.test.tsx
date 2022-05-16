import * as React from 'react'
import { TLReactShape } from '~lib'
import { renderWithApp } from '~test/renderWithApp'
import { Shape } from './Shape'

describe('Shape', () => {
  test('mounts component without crashing', () => {
    class ShapeClass extends TLReactShape {
      static id = 'box'
      ReactComponent = () => <div>Hi</div>
      ReactIndicator = () => <text>Hi</text>
      getBounds = () => ({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      })
    }
    const shape = new ShapeClass({ id: 'box', parentId: 'page1', type: 'box', point: [0, 0] })
    renderWithApp(<Shape shape={shape} zIndex={1} meta={{}} />)
  })
})
