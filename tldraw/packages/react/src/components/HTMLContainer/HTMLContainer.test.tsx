import * as React from 'react'
import { renderWithApp } from '~test/renderWithApp'
import { HTMLContainer } from './HTMLContainer'

describe('HTMLContainer', () => {
  test('mounts component without crashing', () => {
    renderWithApp(<HTMLContainer>Hi</HTMLContainer>)
  })
})
