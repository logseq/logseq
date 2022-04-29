import type { TLDocumentModel } from '@tldraw/core'
import type { Shape } from '~lib'

const documentModel: TLDocumentModel<Shape, any> = {
  currentPageId: 'page1',
  selectedIds: [],
  pages: [
    {
      name: 'Page',
      id: 'page1',
      shapes: [],
      bindings: [],
    },
  ],
  assets: [],
}

export default documentModel
