import * as React from 'react'
import { renderWithApp } from '~test/renderWithApp'
import { HTMLLayer } from './HTMLLayer'

describe('HTMLLayer', () => {
  test('mounts component without crashing', () => {
    renderWithApp(<HTMLLayer>Hi</HTMLLayer>)
  })
})
