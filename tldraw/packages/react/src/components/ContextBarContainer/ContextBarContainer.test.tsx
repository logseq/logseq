import * as React from 'react'
import { ContextBarContainer } from './ContextBarContainer'
import { App } from '~components'
import { render } from '@testing-library/react'

describe('ContextBarContainer', () => {
  test('mounts component without crashing', () => {
    render(
      <App components={{ ContextBar: () => <div>hi</div> }}>
        <ContextBarContainer
          shapes={[]}
          bounds={{
            minX: 500,
            maxX: 600,
            minY: 500,
            maxY: 600,
            width: 100,
            height: 100,
          }}
          hidden={false}
        />
      </App>
    )
  })
})
