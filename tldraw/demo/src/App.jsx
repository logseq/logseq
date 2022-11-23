import { uniqueId, fileToBase64 } from '@tldraw/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { App as TldrawApp, generateJSXFromModel } from '@tldraw/logseq'

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
          size: [240, 0],
          stroke: '',
          fill: '',
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

const Page = () => {
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

const Block = () => {
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

const StatusBarSwitcher = ({ label, onClick }) => {
  const [anchor, setAnchor] = React.useState(null)
  React.useEffect(() => {
    if (anchor) {
      return
    }
    const id = 'status-bar-switcher-' + uniqueId()
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('div')
      el.id = id
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

  if (!anchor) {
    return null
  }

  return ReactDOM.createPortal(
    <button
      className="flex items-center justify-center bg-grey border px-1"
      style={{ fontSize: '1em' }}
      onClick={onClick}
    >
      {label}
    </button>,
    anchor
  )
}

const ThemeSwitcher = () => {
  const [theme, setTheme] = React.useState('light')

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <StatusBarSwitcher
      label={theme + ' theme'}
      onClick={() => {
        setTheme(t => (t === 'dark' ? 'light' : 'dark'))
      }}
    />
  )
}

const PreviewButton = ({ model }) => {
  const [show, setShow] = React.useState(false)

  const [[w, h], setSize] = React.useState([window.innerWidth, window.innerHeight])

  React.useEffect(() => {
    const onResize = () => {
      setSize([window.innerWidth, window.innerHeight])
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const preview = React.useMemo(() => {
    return show ? generateJSXFromModel(model, w / h) : null
  }, [show, model, w, h])

  return (
    <>
      {preview ? (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none h-screen w-screen"
          style={{ zIndex: '10000' }}
        >
          <div className="w-1/2 h-1/2 border bg-white">{preview}</div>
        </div>
      ) : null}
      <StatusBarSwitcher
        label="Preview"
        onClick={() => {
          setShow(s => !s)
        }}
      />
    </>
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
      <ThemeSwitcher />
      <PreviewButton model={model} />
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
        onPersist={app => {
          onPersist(app)
          setModel(app.serialized)
        }}
      />
    </div>
  )
}
