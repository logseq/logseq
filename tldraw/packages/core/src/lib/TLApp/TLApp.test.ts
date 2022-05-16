/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TLResizeCorner, TLRotateCorner, TLTargetType } from '~types'
import { BoxShape } from '~lib/shapes/TLBoxShape/TLBoxShape.test'
import { TLTestApp } from '~test/TLTestApp'
import Vec from '@tldraw/vec'

describe('TLTestApp', () => {
  it('creates a new app', () => {
    const app = new TLTestApp()
    expect(app).toBeTruthy()
  })

  it('creates a new test app', () => {
    const app = new TLTestApp()
    expect(app).toBeTruthy()
  })
})

describe('When creating a TLTestApp', () => {
  it.todo('Loads serialized document via constructor')
  it.todo('Registers shape classes via constructor')
  it.todo('Registers tool classes via constructor')
})

describe('When adding event subscriptions', () => {
  it.todo('Notifies onPersist subscription')
  it.todo('Notifies onSave subscription')
  it.todo('Notifies onSaveAs subscription')
})

describe('When interacting with the public API', () => {
  it.todo('Registers shape classes (provided in constructor')
  it.todo('Registers tools via tools prop')
  it.todo('Changes selected tool...')

  it('Handles events', () => {
    const app = new TLTestApp()
    const spy = jest.fn()
    app.subscribe('mount', spy)
    app.notify('mount', null)
    expect(spy).toHaveBeenCalled()
  })

  it.todo('Changes pages') // changePage
  it.todo('Creates shapes') // create
  it.todo('Updates shapes') // update
  it.todo('Deletes shapes') // delete
  it.todo('Deselects shapes') // deselect
  it.todo('Selects all shapes') // selectAll
  it.todo('Deselects all shapes') // deselectAll
  it.todo('Zooms in') // zoomIn
  it.todo('Zooms out') // zoomOut
  it.todo('Resets zoom') // resetZoom
  it.todo('Zooms to fit') // zoomToFit
  it.todo('Zooms to selection') // zoomToSelection
  it.todo('Toggles the grid') // toggleGrid
  it.todo('Saves (triggers onSave prop)') // save
  it.todo('Saves as (triggers onSaveAs prop)') // saveAs
})

/* ---------------------- Pages --------------------- */

describe('app.getPageById', () => {
  it.todo('Returns a page when passed an id')
})

describe('app.setCurrentPage', () => {
  it.todo('Sets the current page when passed an id')
  it.todo('Sets the current page when passed a page instance')
})

describe('app.addPages', () => {
  it.todo('adds pages when passed an array of page instances')
})

describe('app.removePages', () => {
  it.todo('removes pages when passed an array of page instances')
})

/* ---------------------- Tools --------------------- */

describe('app.selectTool', () => {
  it.todo('Selects a tool when passed a tool id')
})

/* ------------------ Shape Classes ----------------- */

describe('app.registerShapes', () => {
  it.todo('Registers a shape class when passed an array of shape classes')
})

describe('app.deregisterShapes', () => {
  it.todo('Deregisters a shape class when passed an array of shape classes')
})

describe('app.getShapeClass', () => {
  it.todo('Accesses a tool class when passed an id')
})

/* ------------------ Tool Classes ----------------- */

describe('app.registerTools', () => {
  it.todo('Registers a tool class when passed an array of tool classes')
})

describe('app.deregisterTools', () => {
  it.todo('Deregisters a tool class when passed an array of tool classes')
})

/* ------------------ Subscriptions ----------------- */

describe('app.subscribe', () => {
  it('Subscribes to an event and calls the callback', () => {
    const app = new TLTestApp()
    const spy = jest.fn()
    app.subscribe('mount', spy)
    app.notify('mount', null)
    expect(spy).toHaveBeenCalled()
  })
})

describe('app.unsubscribe', () => {
  it('Unsubscribes to an event and no longer calls the callback', () => {
    const app = new TLTestApp()
    const spy = jest.fn()
    const unsub = app.subscribe('mount', spy)
    unsub()
    app.notify('mount', null)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('app.notify', () => {
  it('Calls all subscribed callbacks', () => {
    const app = new TLTestApp()
    const spy1 = jest.fn()
    const spy2 = jest.fn()
    app.subscribe('mount', spy1)
    app.subscribe('mount', spy2)
    app.notify('mount', null)
    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })
})

/* --------------------- Events --------------------- */

describe('When receiving an onTransition event', () => {
  it('Sets `isToolLocked` to false', () => {
    const app = new TLTestApp()
    app.settings.update({ isToolLocked: true })
    app.transition('select')
    expect(app.settings.isToolLocked).toBe(false)
  })
})

describe('When receiving an onWheel event', () => {
  it('Updates the viewport', () => {
    const app = new TLTestApp()
    app.wheel([-1, -1], [0, 0])
    expect(app.viewport.camera).toMatchObject({
      point: [1, 1],
      zoom: 1,
    })
    expect(app.viewport.currentView).toMatchObject({
      minX: -1,
      minY: -1,
      maxX: 1079,
      maxY: 719,
      width: 1080,
      height: 720,
    })
  })
})

describe('Updates the inputs when receiving events', () => {
  it.todo('Updates the inputs onWheel')
  it.todo('Updates the inputs onPointerDown')
  it.todo('Updates the inputs onPointerUp')
  it.todo('Updates the inputs onPointerMove')
  it.todo('Updates the inputs onKeyDown')
  it.todo('Updates the inputs onKeyUp')
  it.todo('Updates the inputs onPinchStart')
  it.todo('Updates the inputs onPinch')
  it.todo('Updates the inputs onPinchEnd')
})

/* --------------------- Shapes --------------------- */

describe('app.getShapeById', () => {
  it.todo('Returns a shape instance when passed an id')
})

describe('app.createShapes', () => {
  it('Creates shapes when passed a serialized shape', () => {
    const app = new TLTestApp()
    app
      .createShapes([
        {
          id: 'newbox1',
          parentId: app.currentPageId,
          type: 'box',
          point: [120, 120],
        },
      ])
      .expectShapesToBeDefined(['newbox1'])
      .expectShapesToHaveProps({
        newbox1: {
          id: 'newbox1',
          point: [120, 120],
        },
      })
  })

  it('Creates shapes when passed a shape instance', () => {
    const app = new TLTestApp()
    app
      .createShapes([
        new BoxShape({
          id: 'newbox2',
          parentId: app.currentPageId,
          type: 'box',
          point: [220, 220],
        }),
      ])
      .expectShapesToBeDefined(['newbox2'])
      .expectShapesToHaveProps({
        newbox2: {
          id: 'newbox2',
          point: [220, 220],
        },
      })
  })
})

describe('app.updateShapes', () => {
  it('Updates shapes when passed an array of new props', () => {
    const app = new TLTestApp()
    app
      .updateShapes([{ id: 'box1', point: [200, 200] }])
      .expectShapesToHaveProps({ box1: { point: [200, 200] } })
      .updateShapes([
        { id: 'box1', point: [300, 300] },
        { id: 'box2', point: [300, 300] },
      ])
      .expectShapesToHaveProps({ box1: { point: [300, 300] } })
  })
})

describe('app.deleteShapes', () => {
  it('Deletes shapes when passed an array of ids', () => {
    const app = new TLTestApp()
    app.deleteShapes(['box1', 'box2']).expectShapesToBeUndefined(['box1', 'box2'])
  })

  it('Deletes shapes when passed an array of shape instances', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.getShapesById(['box1', 'box2']))
      .expectShapesToBeUndefined(['box1', 'box2'])
  })
})

describe('app.setSelectedShapes', () => {
  it('Sets selected shapes when passed an array of ids', () => {
    const app = new TLTestApp()
      .setSelectedShapes(['box1', 'box2'])
      .expectSelectedIdsToBe(['box1', 'box2'])
      .expectSelectedShapesToBe(['box1', 'box2'])
    expect(app.selectedShapesArray.length).toBe(2)
    expect(
      ['box1', 'box2'].every(id => app.selectedShapesArray.includes(app.getShapeById(id)))
    ).toBe(true)
  })

  it('Sets selected shapes when passed an array of shape instances', () => {
    const app = new TLTestApp()
    app
      .setSelectedShapes(app.getShapesById(['box1', 'box2']))
      .expectSelectedIdsToBe(['box1', 'box2'])
      .expectSelectedShapesToBe(['box1', 'box2'])
    expect(app.selectedShapesArray.length).toBe(2)
    expect(
      ['box1', 'box2'].every(id => app.selectedShapesArray.includes(app.getShapeById(id)))
    ).toBe(true)
  })

  it('Clears selected shapes when passed an empty array', () => {
    const app = new TLTestApp()
      .setSelectedShapes([])
      .expectSelectedIdsToBe([])
      .expectSelectedShapesToBe([])
    expect(app.selectedShapesArray.length).toBe(0)
  })
})

describe('app.setSelectionRotation', () => {
  it.todo('Sets the bounds rotation')
})

describe('app.setHoveredShape', () => {
  it('Sets hovered shape when passed a shape id', () => {
    const app = new TLTestApp().setHoveredShape('box1')
    expect(app.hoveredId).toBe('box1')
    expect(app.hoveredShape).toBe(app.getShapeById('box1'))
  })

  it('Sets hovered shape when passed a shape instance', () => {
    const app = new TLTestApp()
    app.setHoveredShape(app.getShapeById('box1'))
    expect(app.hoveredId).toBe('box1')
    expect(app.hoveredShape).toBe(app.getShapeById('box1'))
  })

  it('Clears hovered shape when passed undefined', () => {
    const app = new TLTestApp().setHoveredShape('box1').setHoveredShape(undefined)
    expect(app.hoveredId).toBeUndefined()
    expect(app.hoveredShape).toBeUndefined()
  })
})

describe('app.setEditingShape', () => {
  it('Sets editing shape when passed a shape id', () => {
    const app = new TLTestApp().setEditingShape('box3')
    expect(app.editingId).toBe('box3')
    expect(app.editingShape).toBe(app.getShapeById('box3'))
  })

  it('Sets editing shape when passed a shape instance', () => {
    const app = new TLTestApp()
    app.setEditingShape(app.getShapeById('box3'))
    expect(app.editingId).toBe('box3')
    expect(app.editingShape).toBe(app.getShapeById('box3'))
  })

  it('Clears editing shape when passed undefined', () => {
    const app = new TLTestApp().setEditingShape('box3').setEditingShape(undefined)
    expect(app.editingId).toBeUndefined()
    expect(app.editingShape).toBeUndefined()
  })
})

/* --------------------- Camera --------------------- */

describe('app.setCamera', () => {
  it('Sets the camera when passed a point and zoom', () => {
    const app = new TLTestApp().setCamera([100, 100], 0.5)
    expect(app.viewport.camera).toEqual({ point: [100, 100], zoom: 0.5 })
  })
})

describe('app.getPagePoint', () => {
  it('Converts a screen point to a page point', () => {
    const app = new TLTestApp()
    const points = [
      [100, 120],
      [200, 500],
      [300, 200],
      [-500, -1500],
    ]
    expect(points.map(p => app.getPagePoint(p))).toMatchSnapshot('points1')
    app.setCamera([100, 100], 0.95)
    expect(points.map(p => app.getPagePoint(p))).toMatchSnapshot('points2')
  })

  it('Converts a page point to a screen point', () => {
    const app = new TLTestApp()
    const points = [
      [100, 120],
      [200, 500],
      [300, 200],
      [-500, -1500],
    ]
    expect(points.map(p => app.getScreenPoint(p))).toMatchSnapshot('points1')
    app.setCamera([100, 100], 0.95)
    expect(points.map(p => app.getScreenPoint(p))).toMatchSnapshot('points2')
  })
})

/* --------------------- Display -------------------- */

describe('app.selectionBounds', () => {
  it('Updates selected bounds when selected shapes change', () => {
    const app = new TLTestApp()

    app.setSelectedShapes(['box1'])
    expect(app.selectionBounds).toMatchObject({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      width: 100,
      height: 100,
    })
    app.setSelectedShapes(['box1', 'box2'])
    expect(app.selectionBounds).toMatchObject({
      minX: 0,
      minY: 0,
      maxX: 350,
      maxY: 350,
      width: 350,
      height: 350,
    })
  })

  it('Clears selected bounds when selected shapes is empty', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1', 'box2']).setSelectedShapes([])
    expect(app.selectionBounds).toBeUndefined()
  })
})

describe('app.shapesInViewport', () => {
  it('Updates shapes in viewport when shapes change', () => {
    const app = new TLTestApp()
    expect(app.shapesInViewport).toMatchObject(app.getShapesById(['box1', 'box2', 'box3']))
    app.setCamera([-150, 0], 1)
    expect(app.shapesInViewport).toMatchObject(app.getShapesById(['box2', 'box3']))
    app.setCamera([-550, 0], 1)
    expect(app.shapesInViewport).toMatchObject(app.getShapesById([]))
    app.setCamera([0, 0], 5)
    expect(app.shapesInViewport).toMatchObject(app.getShapesById(['box1']))
    app.setCamera([0, 0], 1)
    expect(app.shapesInViewport).toMatchObject(app.getShapesById(['box1', 'box2', 'box3']))
  })
  it.todo('Updates shapes in viewport when viewport bounds change')
})

describe('app.selectionDirectionHint', () => {
  it('Is undefined when the selection is on screen', () => {
    const app = new TLTestApp().setSelectedShapes(['box1'])
    expect(app.selectionDirectionHint).toBeUndefined()
    app.setCamera([-150, 0], 1)
    expect(Vec.toFixed(app.selectionDirectionHint!, 2)).toMatchObject([-0.59, -0.43])
  })

  it('Is positioned correctly when the bounds are non-zero', () => {
    const app = new TLTestApp().setSelectedShapes(['box1'])
    app.viewport.updateBounds({
      minX: 100,
      minY: 100,
      maxX: 1180,
      maxY: 820,
      width: 1080,
      height: 720,
    })
    app.setCamera([-150, 0], 1)
    expect(Vec.toFixed(app.selectionDirectionHint!, 2)).toMatchObject([-0.59, -0.43])
  })
})

describe('app.showSelection', () => {
  it('Shows selection only if the select tool is active and there are selected shapes', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.showSelection).toBe(true)
  })
  it.todo('Hides selection if the only selected shape has hideSelection=true')
  it.todo('Shows when more than one shape is selected, even if some/all have hideSelection=true')
})

describe('app.showSelectionDetail', () => {
  it.todo('Shows detail only if the select tool is active and there are selected shapes')
  it.todo('Hides detail if all selected shapes have hideSelection=true')
  it.todo('Shows when more than one shape is selected, even if some/all have hideSelection=true')
})

describe('app.showSelectionRotation', () => {
  it.todo('Shows rotation only if showing selection detail')
  it.todo('Shows rotation only if select tool is in rotating or pointingRotateHandle state')
})

describe('app.showContextBar', () => {
  it('Hides context bar when there are no shapes selected', () => {
    const app = new TLTestApp()
    app.setSelectedShapes([])
    expect(app.showContextBar).toBe(false)
  })

  it('Shows context bar if any of the selected shapes has hideContextBar=false', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.showResizeHandles).toBe(true)

    class TLNoContextBarBoxShape extends BoxShape {
      static id = 'nocontextbarbox'
      hideContextBar = true
    }

    app.registerShapes([TLNoContextBarBoxShape])
    app.createShapes([
      {
        id: 'nocontextbarbox1',
        type: 'nocontextbarbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['box1', 'nocontextbarbox1'])
    expect(app.showContextBar).toBe(true)
  })

  it('Hides context bar if all selected shapes have hideContextBar=true', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])

    class TLNoContextBarBoxShape extends BoxShape {
      static id = 'nocontextbarbox'
      hideContextBar = true
    }
    app.registerShapes([TLNoContextBarBoxShape])
    app.createShapes([
      {
        id: 'nocontextbarbox1',
        type: 'nocontextbarbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['nocontextbarbox1'])
    expect(app.showContextBar).toBe(false)
  })

  it('Hides context bar when the state is not select.idle/hoveringSelectionHandle', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showContextBar).toBe(true)
    app.pointerDown([0, 0], 'box1')
    expect(app.isIn('select.pointingSelectedShape')).toBe(true)
    expect(app.showContextBar).toBe(false)
    app.pointerUp([0, 0], 'box1')
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showContextBar).toBe(true)
    app.pointerEnter([0, 0], {
      type: TLTargetType.Selection,
      handle: TLResizeCorner.TopLeft,
    })
    expect(app.isIn('select.hoveringSelectionHandle')).toBe(true)
    expect(app.showContextBar).toBe(true)
    app.pointerLeave([0, 0], {
      type: TLTargetType.Selection,
      handle: TLResizeCorner.TopLeft,
    })
    app.pointerDown([-10, -10], { type: TLTargetType.Canvas })
    expect(app.isIn('select.pointingCanvas')).toBe(true)
    expect(app.showContextBar).toBe(false)
  })
})

// Resize handles

describe('app.showResizeHandles', () => {
  it('Hides resize handles when there are no shapes selected', () => {
    const app = new TLTestApp()
    app.setSelectedShapes([])
    expect(app.showResizeHandles).toBe(false)
  })

  it('Shows resize handles if any of the selected shapes has hideResizeHandles=false', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.showResizeHandles).toBe(true)
    class TLNoHandlesBoxShape extends BoxShape {
      static id = 'noresizehandlesbox'
      hideResizeHandles = true
    }
    app.registerShapes([TLNoHandlesBoxShape])
    app.createShapes([
      {
        id: 'noresizehandlesbox1',
        type: 'noresizehandlesbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['box1', 'noresizehandlesbox1'])
    expect(app.showResizeHandles).toBe(true)
  })

  it('Hides resize handles if there is a selected shape with hideResizeHandles=true', () => {
    const app = new TLTestApp()
    class TLNoHandlesBoxShape extends BoxShape {
      static id = 'noresizehandlesbox'
      hideResizeHandles = true
    }
    app.registerShapes([TLNoHandlesBoxShape])
    app.createShapes([
      {
        id: 'noresizehandlesbox1',
        type: 'noresizehandlesbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['noresizehandlesbox1'])
    expect(app.showResizeHandles).toBe(false)
  })

  it('Hides resize handles when the state is not select.idle/hoveringSelectionHandle/pointingResizeHandle/pointingRotateHandle', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showResizeHandles).toBe(true)
    app.pointerDown([0, 0], 'box1')
    expect(app.isIn('select.pointingSelectedShape')).toBe(true)
    expect(app.showResizeHandles).toBe(false)
    app.pointerUp([0, 0], 'box1')
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showResizeHandles).toBe(true)
    app.pointerEnter([0, 0], {
      type: TLTargetType.Selection,
      handle: TLResizeCorner.TopLeft,
    })
    expect(app.isIn('select.hoveringSelectionHandle')).toBe(true)
    expect(app.showResizeHandles).toBe(true)
    app.pointerDown([0, 0], {
      type: TLTargetType.Selection,
      handle: TLResizeCorner.TopLeft,
    })
    expect(app.isIn('select.pointingResizeHandle')).toBe(true)
    expect(app.showResizeHandles).toBe(true)
    app
      .pointerUp([0, 0], {
        type: TLTargetType.Selection,
        handle: TLResizeCorner.TopLeft,
      })
      .pointerLeave([0, 0], {
        type: TLTargetType.Selection,
        handle: TLResizeCorner.TopLeft,
      })
      // test rotate handle
      .pointerDown([-10, -10], { type: TLTargetType.Canvas })
    expect(app.isIn('select.pointingCanvas')).toBe(true)
    expect(app.showResizeHandles).toBe(false)
  })
})

describe('app.showRotateHandles', () => {
  it('Hides rotate handle when there are no shapes selected', () => {
    const app = new TLTestApp()
    app.setSelectedShapes([])
    expect(app.showRotateHandles).toBe(false)
  })

  it('Shows rotate handle if any of the selected shapes has hideRotateHandle=false', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.showRotateHandles).toBe(true)

    class TLNoRotateHandleBoxShape extends BoxShape {
      static id = 'norotatehandlesbox'
      hideRotateHandle = true
    }
    app.registerShapes([TLNoRotateHandleBoxShape])
    app.createShapes([
      {
        id: 'norotatehandlesbox1',
        type: 'norotatehandlesbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['box1', 'norotatehandlesbox1'])
    expect(app.showRotateHandles).toBe(true)
  })

  it('Hides rotate handle if there is a selected shape with hideRotateHandles=true', () => {
    const app = new TLTestApp()
    class TLNoRotateHandleBoxShape extends BoxShape {
      static id = 'norotatehandlesbox'
      hideRotateHandle = true
    }
    app.registerShapes([TLNoRotateHandleBoxShape])
    app.createShapes([
      {
        id: 'norotatehandlesbox1',
        type: 'norotatehandlesbox',
        point: [0, 0],
        parentId: app.currentPageId,
      },
    ])
    app.setSelectedShapes(['norotatehandlesbox1'])
    expect(app.showRotateHandles).toBe(false)
  })

  it('Hides rotate handles when the state is not hoveringSelectionHandle/pointingResizeHandle/pointingRotateHandle', () => {
    const app = new TLTestApp()
    app.setSelectedShapes(['box1'])
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showRotateHandles).toBe(true)
    app.pointerDown([0, 0], 'box1')
    expect(app.isIn('select.pointingSelectedShape')).toBe(true)
    expect(app.showRotateHandles).toBe(false)
    app.pointerUp([0, 0], 'box1')
    expect(app.isIn('select.idle')).toBe(true)
    expect(app.showRotateHandles).toBe(true)
    app.pointerEnter([0, 0], {
      type: TLTargetType.Selection,
      handle: 'rotate',
    })
    expect(app.isIn('select.hoveringSelectionHandle')).toBe(true)
    expect(app.showRotateHandles).toBe(true)
    app.pointerDown([0, 0], {
      type: TLTargetType.Selection,
      handle: TLRotateCorner.TopLeft,
    })
    expect(app.isIn('select.pointingRotateHandle')).toBe(true)
    expect(app.showRotateHandles).toBe(true)
    app
      .pointerUp([0, 0], {
        type: TLTargetType.Selection,
        handle: 'rotate',
      })
      .pointerLeave([0, 0], {
        type: TLTargetType.Selection,
        handle: 'rotate',
      })
      // test resize handle
      .pointerDown([-10, -10], { type: TLTargetType.Canvas })
    expect(app.isIn('select.pointingCanvas')).toBe(true)
    expect(app.showRotateHandles).toBe(false)
  })
})

/* ---------------------- Brush --------------------- */

describe('app.setBrush', () => {
  it('Sets brush when passed a bounding box', () => {
    const app = new TLTestApp()
    app.setBrush({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      width: 100,
      height: 100,
    })
    expect(app.brush).toMatchObject({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      width: 100,
      height: 100,
    })
  })

  it('Clears brush when passed undefined', () => {
    const app = new TLTestApp()
    app.setBrush({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      width: 100,
      height: 100,
    })
    app.setBrush(undefined)
    expect(app.brush).toBeUndefined()
  })
})

/* --------------------- History -------------------- */

describe('app.undo', () => {
  it.todo('undoes a change')
  it.todo('does nothing if no past undo history')
})

describe('app.redo', () => {
  it.todo('redoes a change')
  it.todo('does nothing if no future undo history')
})

/* -------------------- Document -------------------- */

describe('app.loadDocumentModel', () => {
  it('Loads a document from JSON', () => {
    const app = new TLTestApp()
    app.loadDocumentModel({
      currentPageId: 'page1',
      selectedIds: ['jbox'],
      pages: [
        {
          name: 'page1',
          id: 'page1',
          shapes: [
            {
              id: 'jbox',
              type: 'box',
              point: [0, 0],
              parentId: 'page1',
            },
          ],
          bindings: [],
        },
      ],
    })

    expect(app.currentPageId).toBe('page1')
    expect(app.selectedIds.size).toBe(1)
    expect(app.selectedShapesArray[0]).toBe(app.getShapeById('jbox'))
    expect(app.pages.size).toBe(1)
    expect(app.currentPage.shapes.length).toBe(1)
    expect(app.getShapeById('jbox')).toBeDefined
  })

  it('Fails with warning if given a malformed document', () => {
    const app = new TLTestApp()
    const warn = jest.fn()
    jest.spyOn(console, 'warn').mockImplementation(warn)
    app.loadDocumentModel({
      currentPageId: 'page1',
      selectedIds: [],
      // @ts-expect-error - we're testing the warning
      pages: 'frog dog',
    })
    expect(warn).toHaveBeenCalled()
  })
})
