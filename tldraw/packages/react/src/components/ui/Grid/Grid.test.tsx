import * as React from 'react'
import { Grid } from './Grid'
import { renderWithApp } from '~test/renderWithApp'

describe('Grid', () => {
  test('mounts component without crashing', () => {
    renderWithApp(<Grid size={10} />)
  })
})
