import * as React from 'react'
import { render } from '@testing-library/react'
import { App } from '~components'

export function renderWithApp(children: JSX.Element) {
  render(<App>{children}</App>)
}
