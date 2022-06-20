import React from 'react'
import ReactDOM from 'react-dom'
import { App as TldrawApp } from 'tldraw-logseq'

const storingKey = 'playground.index'

const onPersist = app => {
  console.log('onPersist', app)
  window.sessionStorage.setItem(storingKey, JSON.stringify(app.serialized))
}

const onLoad = () => {
  return JSON.parse(window.sessionStorage.getItem(storingKey))
}

const documentModel = onLoad() ?? {
  currentPageId: 'page1',
  selectedIds: ['p6bv7EfoQPIF1eZB1RRO6'],
  pages: [
    {
      id: 'page1',
      name: 'Page',
      shapes: [
        {
          scale: [1, 1],
          id: 'p6bv7EfoQPIF1eZB1RRO6',
          type: 'logseq-portal',
          parentId: 'page1',
          point: [769.109375, 170.5546875],
          size: [390.671875, 295.3671875],
          stroke: '#000000',
          fill: '#ffffff',
          strokeWidth: 2,
          opacity: 1,
          pageId: '',
          nonce: 1,
        },
      ],
      bindings: {},
      nonce: 2,
    },
  ],
}

const list = ['foo', 'bar']

const Page = props => {
  const [value, setValue] = React.useState(JSON.stringify(props, null, 2))
  return (
    <textarea
      className="whitespace-pre w-full h-full font-mono"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}

const ThemeSwitcher = ({ theme, setTheme }) => {
  const [anchor, setAnchor] = React.useState(null)
  React.useEffect(() => {
    if (anchor) {
      return
    }
    let el = document.querySelector('#theme-switcher')
    if (!el) {
      el = document.createElement('div')
      el.id = 'theme-switcher'
      let timer = setInterval(() => {
        const statusBarAnchor = document.querySelector('#tl-statusbar-anchor')
        if (statusBarAnchor) {
          statusBarAnchor.appendChild(el)
          setAnchor(el)
          clearInterval(timer)
        }
      }, 50)
    }
  })

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  if (!anchor) {
    return null
  }

  return ReactDOM.createPortal(
    <button
      className="flex items-center justify-center mx-2 bg-grey"
      style={{ fontSize: '1em' }}
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme} theme
    </button>,
    anchor
  )
}

export default function App() {
  const [theme, setTheme] = React.useState('light')

  return (
    <div className={`h-screen w-screen`}>
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <TldrawApp
        PageComponent={Page}
        searchHandler={q => (q ? list : [])}
        model={documentModel}
        onPersist={onPersist}
      />
    </div>
  )
}
