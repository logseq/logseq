import type { TLDocumentModel } from '@tldraw/core'
import type { Shape } from '~lib'

const documentModel: TLDocumentModel<Shape, any> = {
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

export default documentModel
