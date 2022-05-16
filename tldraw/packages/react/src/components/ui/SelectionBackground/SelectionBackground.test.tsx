import * as React from 'react'
import { renderWithApp } from '~test/renderWithApp'
import { SelectionBackground } from './SelectionBackground'

describe('SelectionBackground', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <SelectionBackground
        bounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
        zoom={1}
        shapes={[]}
        showResizeHandles={false}
        showRotateHandles={false}
      />
    )
  })
})
