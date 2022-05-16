import { TLTestApp } from '~test/TLTestApp'
import type { TLDocumentModel } from '~lib'

const documentModel: TLDocumentModel = {
  currentPageId: 'page1',
  selectedIds: ['box1'],
  pages: [
    {
      name: 'Page',
      id: 'page1',
      shapes: [
        {
          id: 'A',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'B',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'C',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'D',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'E',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'F',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
        {
          id: 'G',
          type: 'box',
          parentId: 'page1',
          point: [0, 0],
        },
      ],
      bindings: [],
    },
  ],
}

describe('Creates a page from a serialized page model', () => {
  it.todo('Creates page')
})

describe('When creating shapes', () => {
  it.todo('Creates shapes')
})

describe('When removing shapes', () => {
  it.todo('Removes shapes')
})

describe('When running zindex tests', () => {
  it('Correctly identifies shapes in order', () => {
    new TLTestApp(documentModel).expectShapesInOrder('A', 'B', 'C', 'D')
  })
})

describe('When sending to back', () => {
  it('Moves one shape to back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['D'])
      .sendToBack()
      .expectShapesInOrder('D', 'A', 'B', 'C')
      .sendToBack() // noop
      .expectShapesInOrder('D', 'A', 'B', 'C')
  })

  it('Moves no shapes when selecting shapes at the back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'B', 'C'])
      .sendToBack()
      .expectShapesInOrder('A', 'B', 'C')
      .sendToBack()
      .expectShapesInOrder('A', 'B', 'C')
  })

  it('Moves two adjacent shapes to back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['D', 'E'])
      .sendToBack()
      .expectShapesInOrder('D', 'E', 'A', 'B', 'C', 'F', 'G')
      .sendToBack()
      .expectShapesInOrder('D', 'E', 'A', 'B', 'C', 'F', 'G')
  })

  it('Moves non-adjacent shapes to back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['E', 'G'])
      .sendToBack()
      .expectShapesInOrder('E', 'G', 'A', 'B', 'C', 'D', 'F')
      .sendToBack()
      .expectShapesInOrder('E', 'G', 'A', 'B', 'C', 'D', 'F')
  })

  it('Moves non-adjacent shapes to back when one is at the back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'G'])
      .sendToBack()
      .expectShapesInOrder('A', 'G', 'B', 'C', 'D', 'E', 'F')
      .sendToBack()
      .expectShapesInOrder('A', 'G', 'B', 'C', 'D', 'E', 'F')
  })
})

describe('When sending to front', () => {
  it('Moves one shape to front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A'])
      .bringToFront()
      .expectShapesInOrder('B', 'C', 'D', 'E', 'F', 'G', 'A')
      .bringToFront() // noop
      .expectShapesInOrder('B', 'C', 'D', 'E', 'F', 'G', 'A')
  })

  it('Moves no shapes when selecting shapes at the front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['G'])
      .bringToFront()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
      .bringToFront() // noop
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
  })

  it('Moves two adjacent shapes to front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['D', 'E'])
      .bringToFront()
      .expectShapesInOrder('A', 'B', 'C', 'F', 'G', 'D', 'E')
      .bringToFront() // noop
      .expectShapesInOrder('A', 'B', 'C', 'F', 'G', 'D', 'E')
  })

  it('Moves non-adjacent shapes to front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'C'])
      .bringToFront()
      .expectShapesInOrder('B', 'D', 'E', 'F', 'G', 'A', 'C')
      .bringToFront() // noop
      .expectShapesInOrder('B', 'D', 'E', 'F', 'G', 'A', 'C')
  })

  it('Moves non-adjacent shapes to front when one is at the front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['E', 'G'])
      .bringToFront()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'F', 'E', 'G')
      .bringToFront()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'F', 'E', 'G')
  })
})

describe('When sending backward', () => {
  it('Moves one shape backward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['C'])
      .sendBackward()
      .expectShapesInOrder('A', 'C', 'B')
      .sendBackward() // noop
      .expectShapesInOrder('C', 'A', 'B')
  })

  it('Moves no shapes when sending shapes at the back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'B', 'C'])
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C')
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C')
  })

  it('Moves two adjacent shapes backward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'E'])
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'E', 'D', 'F', 'G')
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'E', 'C', 'D', 'F', 'G')
  })

  it('Moves non-adjacent shapes backward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['E', 'G'])
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'E', 'D', 'G', 'F')
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'E', 'C', 'G', 'D', 'F')
  })

  it('Moves non-adjacent shapes backward when one is at the back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'G'])
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'G', 'F')
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'G', 'E', 'F')
  })

  it('Moves non-adjacent shapes to backward when both are at the back', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'B'])
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
      .sendBackward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
  })
})

describe('When moving forward', () => {
  it('Moves one shape forward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A'])
      .bringForward()
      .expectShapesInOrder('B', 'A', 'C', 'D', 'E', 'F', 'G')
      .bringForward()
      .expectShapesInOrder('B', 'C', 'A', 'D', 'E', 'F', 'G')
  })

  it('Moves no shapes when sending shapes at the front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['E', 'F', 'G'])
      .bringForward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
      .bringForward() // noop
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
  })

  it('Moves two adjacent shapes forward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['C', 'D'])
      .bringForward()
      .expectShapesInOrder('A', 'B', 'E', 'C', 'D', 'F', 'G')
      .bringForward()
      .expectShapesInOrder('A', 'B', 'E', 'F', 'C', 'D', 'G')
  })

  it('Moves non-adjacent shapes forward', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['A', 'C'])
      .bringForward()
      .expectShapesInOrder('B', 'A', 'D', 'C', 'E', 'F', 'G')
      .bringForward()
      .expectShapesInOrder('B', 'D', 'A', 'E', 'C', 'F', 'G')
  })

  it('Moves non-adjacent shapes to forward when one is at the front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['C', 'G'])
      .bringForward()
      .expectShapesInOrder('A', 'B', 'D', 'C', 'E', 'F', 'G')
      .bringForward()
      .expectShapesInOrder('A', 'B', 'D', 'E', 'C', 'F', 'G')
  })

  it('Moves non-adjacent shapes to forward when both are at the front', () => {
    new TLTestApp(documentModel)
      .setSelectedShapes(['F', 'G'])
      .bringForward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
      .bringForward()
      .expectShapesInOrder('A', 'B', 'C', 'D', 'E', 'F', 'G')
  })
})
