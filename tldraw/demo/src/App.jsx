import { App as TldrawApp } from 'tldraw-logseq'

const storingKey = 'playground.index'

const onPersist = app => {
  sessionStorage.setItem(storingKey, JSON.stringify(app.serialized))
}

const onLoad = () => {
  return JSON.parse(sessionStorage.getItem(storingKey))
}

const documentModel = onLoad() ?? {
  currentPageId: 'page1',
  selectedIds: ['yt1', 'yt2'],
  pages: [
    {
      name: 'Page',
      id: 'page1',
      shapes: [
        {
          id: 'yt1',
          type: 'youtube',
          parentId: 'page1',
          point: [100, 100],
          size: [160, 90],
          embedId: '',
        },
        {
          id: 'yt2',
          type: 'youtube',
          parentId: 'page1',
          point: [300, 300],
          size: [160, 90],
          embedId: '',
        },
      ],
      bindings: [],
    },
  ],
  assets: [],
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
