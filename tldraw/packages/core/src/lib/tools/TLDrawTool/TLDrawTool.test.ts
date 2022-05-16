import { TLTestApp } from '~test'

describe('When using the draw tool', () => {
  it('Starts in idle', () => {
    const app = new TLTestApp().selectTool('draw')
    expect(app.isIn('draw.idle')).toBe(true)
  })
  it('Transitions to creating and creates a shape on pointer down', () => {
    const app = new TLTestApp()
    app.deleteShapes(app.shapes).selectTool('draw')
    expect(app.shapes.length).toBe(0)
    app.pointerDown([100, 100])
    expect(app.shapes.length).toBe(1)
    const shape = app.shapes[0]
    shape.update({ id: 'test_draw' })
    expect(shape).toMatchSnapshot('created draw')
  })
  it('Extends the shapes points while moving in the creating state', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([110, 110])
      .pointerMove([120, 120])
    const shape = app.shapes[0]
    expect(app.shapes.length).toBe(1)
    expect(shape.props.points.length).toBe(3)
  })
  it('Creates multiple shapes', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([110, 110])
      .pointerMove([120, 120])
      .pointerUp()
    expect(app.shapes.length).toBe(1)
    app.pointerDown([200, 200]).pointerMove([210, 210]).pointerMove([220, 220]).pointerUp()
    expect(app.shapes.length).toBe(2)
  })
  it("Extends the previous shape's points if pressing shift moving in the creating state", () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([110, 110])
      .pointerMove([120, 120])
      .pointerUp()
      .pointerDown([220, 220], undefined, { shiftKey: true })
      .pointerMove([300, 300])
    expect(app.shapes.length).toBe(1)
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([100, 100])
  })
  it('Cancels creating a shape when escape is pressed', () => {
    const app = new TLTestApp()
    app.deleteShapes(app.shapes)
    expect(app.shapes.length).toBe(0)
    app
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([100, 150])
      .keyDown('Escape')
      .pointerUp()
    expect(app.isIn('draw.idle')).toBe(true)
    expect(app.shapes.length).toBe(0)
  })
  it('Transitions from idle to select.idle on Escape', () => {
    const app = new TLTestApp().selectTool('draw')
    expect(app.isIn('draw.idle')).toBe(true)
    app.keyDown('Escape')
    expect(app.isIn('select.idle')).toBe(true)
  })
})

describe('When creating the draw shape', () => {
  it("Offsets the points when the shape's point changes", () => {
    const app = new TLTestApp()
    app.deleteShapes(app.shapes).selectTool('draw').pointerDown([100, 100])
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([100, 100])
    app.pointerMove([200, 200])
    expect(shape.props.point).toMatchObject([100, 100])
    expect(shape.props.points[shape.props.points.length - 1]).toMatchObject([100, 100, 0.5])
    app.pointerMove([-50, 200])
    expect(shape.props.point).toMatchObject([-50, 100])
    expect(shape.props.points[shape.props.points.length - 1]).toMatchObject([0, 100, 0.5])
  })
})

describe('When extending the draw shape', () => {
  it("Offsets the points when the shape's point changes", () => {
    const app = new TLTestApp()
    app.deleteShapes(app.shapes).selectTool('draw').pointerDown([0, 0])
    const shape = app.shapes[0]
    app.pointerMove([100, 100]).pointerUp()
    expect(shape.props.points).toMatchObject([
      [0, 0, 0.5],
      [100, 100, 0.5],
    ])
    app.pointerMove([-100, 100]).pointerDown([-100, 100], undefined, { shiftKey: true })
    expect(shape.props.points[shape.props.points.length - 1]).toMatchObject([0, 100, 0.5])
    expect(shape.props.point).toMatchObject([-100, 0])
    expect(shape.props.points.slice(0, 2)).toMatchObject([
      [100, 0, 0.5],
      [200, 100, 0.5],
    ])
    expect(shape.props.points[shape.props.points.length - 1]).toMatchObject([0, 100, 0.5])
    app.pointerMove([-110, 110])
    expect(shape.props.points.slice(0, 2)).toMatchObject([
      [110, 0, 0.5],
      [210, 100, 0.5],
    ])
    expect(shape.props.points[shape.props.points.length - 1]).toMatchObject([0, 110, 0.5])
  })
  it('Extends down and left without changing the point', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([200, 200])
      .pointerUp()
      .pointerDown([300, 300], undefined, { shiftKey: true })
      .pointerMove([400, 400])
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([100, 100])
  })
  it('Repositions when dragging past initial x and y', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([200, 200])
      .pointerUp()
      .pointerDown([300, 300], undefined, { shiftKey: true })
      .pointerMove([400, 400])
      .pointerMove([50, 400])
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([50, 100])
  })
  it('Extends up or left and shifts points', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([0, 0])
      .pointerMove([50, 50])
      .pointerUp()
      .pointerDown([-50, 100], undefined, { shiftKey: true })
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([-50, 0])
    // expect(shape.props.points).toMatchObject([
    //   [50, 50],
    //   [100, 100],
    //   [0, 0],
    // ])
  })
  it('Repositions when dragging past initial x and y after shifting points', () => {
    const app = new TLTestApp()
    app
      .deleteShapes(app.shapes)
      .selectTool('draw')
      .pointerDown([100, 100])
      .pointerMove([200, 200])
      .pointerUp()
      .pointerDown([300, 300], undefined, { shiftKey: true })
      .pointerMove([400, 400])
      .pointerMove([50, 400])
    const shape = app.shapes[0]
    expect(shape.props.point).toMatchObject([50, 100])
  })
})
