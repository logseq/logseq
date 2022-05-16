import * as React from 'react'
import { App } from './App'
import { render } from '@testing-library/react'

describe('App', () => {
  test('mounts component without crashing', () => {
    render(<App />)
  })
})
