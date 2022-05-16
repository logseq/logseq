import * as React from 'react'
import { renderWithApp } from '~test/renderWithApp'
import { SVGLayer } from './SVGLayer'

describe('SVGLayer', () => {
  test('mounts component without crashing', () => {
    renderWithApp(
      <SVGLayer>
        <text>hi</text>
      </SVGLayer>
    )
  })
})
