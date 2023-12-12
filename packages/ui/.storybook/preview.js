import '../src/radix.css'
import '../src/radix-hsl.css'
import './theme.css'
import '../src/index.css'
import { useEffect } from 'react'

// require in this file to keep app state when HMR
const { setupGlobals } = require('../src')

setupGlobals()

// REPL
if (process.env.NODE_ENV !== 'production') {
  require('./cljs/cljs_env')
  require('./cljs/shadow.cljs.devtools.client.browser')
}

function ThemeObserver(
  { children }
) {
  const theme = window.localStorage.getItem('__ls-theme-color__')

  useEffect(() => {
    const html = document.documentElement
    html.dataset.color = theme
    return () => (delete html.dataset.theme)
  }, [theme])

  return (
    <div className={'p-4'}>
      {children}
    </div>
  )
}

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <ThemeObserver>
          <Story/>
        </ThemeObserver>
      )
    }
  ],
  globalTypes: {
    theme: {
      // description: 'Global theme for components',
      // defaultValue: 'light',
      // toolbar: {
      //   // The label to show for this toolbar item
      //   title: 'Theme',
      //   icon: 'circlehollow',
      //   // Array of plain string values or MenuItem shape (see below)
      //   items: ['light', 'dark'],
      //   // Change title based on selected value
      //   dynamicTitle: true,
      // },
    },
  },
}

export default preview
