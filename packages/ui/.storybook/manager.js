import React from 'react'

import { addons, types } from '@storybook/manager-api'
import { FORCE_RE_RENDER } from '@storybook/core-events'

addons.register('my/toolbar', () => {
  addons.add('my-toolbar-addon/toolbar', {
    title: 'Example Storybook toolbar',
    //👇 Sets the type of UI element in Storybook
    type: types.TOOL,
    //👇 Shows the Toolbar UI element if either the Canvas or Docs tab is active
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story|docs)$/)),
    render: ({ active }) => {
      const defaultTheme = window.localStorage.getItem('__ls-theme-color__')
      return (
        <div style={{ display: 'flex', alignItems: 'center', padding: 15 }}>
          <select onChange={(e) => {
            const value = e.target.value
            window.localStorage.setItem('__ls-theme-color__', value)
            addons.getChannel().emit(FORCE_RE_RENDER)
          }} defaultValue={defaultTheme || 'default'}>
            {['default', 'blue', 'orange', 'green'].map(it => {
              return <option value={it} key={it}>{it}</option>
            })}
          </select>
        </div>
      )
    },
  })
})