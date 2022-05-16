import * as React from 'react'
import { Container } from './Container'
import { renderWithApp } from '~test/renderWithApp'

describe('Container', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <Container
        bounds={{
          minX: 500,
          maxX: 600,
          minY: 500,
          maxY: 600,
          width: 100,
          height: 100,
        }}
        hidden={false}
      >
        Hello
      </Container>
    )
  })
})
