import React from 'react'
import { App as TldrawApp } from 'tldraw-logseq'

const storingKey = 'playground.index'

const onPersist = app => {
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
  return <pre>{JSON.stringify(props, null, 2)}</pre>
}

export default function App() {
  return (
    <div className="h-screen w-screen">
      <TldrawApp
        PageComponent={Page}
        searchHandler={q => (q ? list : [])}
        model={documentModel}
        onPersist={onPersist}
      />
    </div>
  )
}
