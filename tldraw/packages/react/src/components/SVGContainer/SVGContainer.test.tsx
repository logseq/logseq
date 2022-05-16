import * as React from 'react'
import { renderWithApp } from '~test/renderWithApp'
import { SVGContainer } from './SVGContainer'

describe('SVGContainer', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <SVGContainer>
        <text>hi</text>
      </SVGContainer>
    )
  })
})
