import * as React from 'react'
import { Cursor } from './Cursor'
import { renderWithApp } from '~test/renderWithApp'

describe('Cursor', () => {
  test('mounts component without crashing', () => {
    renderWithApp(<Cursor />)
  })
})
