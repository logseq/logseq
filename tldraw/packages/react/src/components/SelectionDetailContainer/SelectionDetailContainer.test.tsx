import * as React from 'react'
import { SelectionDetailContainer } from './SelectionDetailContainer'
import { renderWithApp } from '~test/renderWithApp'

describe('SelectionDetailContainer', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <SelectionDetailContainer
        shapes={[]}
        bounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
        detail={'size'}
        hidden={false}
      />
    )
  })
})
