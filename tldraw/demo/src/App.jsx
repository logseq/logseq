import { uniqueId, fileToBase64 } from '@tldraw/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { App as TldrawApp } from '@tldraw/logseq'

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
          blockType: 'B',
          id: 'p6bv7EfoQPIF1eZB1RRO6',
          type: 'logseq-portal',
          parentId: 'page1',
          point: [369.109375, 170.5546875],
          size: [0, 0],
          stroke: '#000000',
          fill: '#ffffff',
          strokeWidth: 2,
          opacity: 1,
          pageId: 'aaasssdddfff',
          nonce: 1,
        },
      ],
      bindings: {},
      nonce: 2,
    },
  ],
}

const Page = props => {
  const [value, setValue] = React.useState(JSON.stringify(props, null, 2))
  return (
    <div className="w-full font-mono page">
      The Circle components are a collection of standardized UI elements and patterns for building
      products. These pages provide more information and best practices on how to use the
      components.The Circle components are a collection of standardized UI elements and patterns for
      building products. These pages provide more information and best practices on how to use the
      components.
    </div>
  )
}

const Block = props => {
  return (
    <div className="w-full font-mono single-block">
      The Circle components are a collection of standardized UI elements and patterns for building
      products. These pages provide more information and best practices on how to use the
      components.The Circle components are a collection of standardized UI elements and patterns for
      building products. These pages provide more information and best practices on how to use the
      components.
    </div>
  )
}

const Breadcrumb = props => {
  return <div className="font-mono">{props.blockId}</div>
}

const PageNameLink = props => {
  const [value, setValue] = React.useState(JSON.stringify(props))
  return (
    <input
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

const searchHandler = q => {
  return Promise.resolve({
    pages: ['foo', 'bar', 'asdf'].filter(p => p.includes(q)),
    blocks: [
      { content: 'foo content 1', uuid: 'uuid 1', page: 0 },
      { content: 'bar content 2', uuid: 'uuid 2', page: 1 },
      { content: 'asdf content 3', uuid: 'uuid 3', page: 2 },
    ],
  })
}

export default function App() {
  const [theme, setTheme] = React.useState('light')

  const [model, setModel] = React.useState(documentModel)

  // Mimic external reload event
  React.useEffect(() => {
    const interval = setInterval(() => {
      // setModel(onLoad())
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={`h-screen w-screen`}>
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <TldrawApp
        renderers={{
          Page,
          Block,
          Breadcrumb,
          PageNameLink,
        }}
        handlers={{
          search: searchHandler,
          addNewBlock: () => uniqueId(),
          queryBlockByUUID: uuid => ({ uuid, content: 'some random content' }),
          isWhiteboardPage: () => false,
          saveAsset: fileToBase64,
          makeAssetUrl: a => a,
        }}
        model={model}
        onPersist={onPersist}
      />
    </div>
  )
}
