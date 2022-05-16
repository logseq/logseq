import * as React from 'react'
import { SelectionDetail } from './SelectionDetail'
import { renderWithApp } from '~test/renderWithApp'

describe('SelectionDetail', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <SelectionDetail
        shapes={[]}
        bounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
        scaledBounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
        zoom={1}
        detail={'size'}
      />
    )
  })
})
