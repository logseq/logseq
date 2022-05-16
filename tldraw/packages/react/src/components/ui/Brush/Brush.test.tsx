import * as React from 'react'
import { Brush } from './Brush'
import { renderWithApp } from '~test/renderWithApp'

describe('Brush', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <Brush
        bounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
      />
    )
  })
})
