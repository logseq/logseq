import { TLTestApp } from '~test'

describe('When using the tool', () => {
  it('Starts in idle', () => {
    const app = new TLTestApp().selectTool('erase')
    expect(app.isIn('erase.idle')).toBe(true)
  })
  it('Transitions to pointing on pointerdown', () => {
    const app = new TLTestApp().selectTool('erase').pointerDown([100, 100])
    expect(app.isIn('erase.pointing')).toBe(true)
  })
  it('Transitions to creating only after leaving the dead zone', () => {
    const app = new TLTestApp().selectTool('erase').pointerDown([100, 100]).pointerMove([100, 105])
    expect(app.isIn('erase.pointing')).toBe(true)
    app.pointerMove([100, 106])
    expect(app.isIn('erase.erasing')).toBe(true)
  })
  it.todo('Erases all shapes under the pointer on pointer up from pointing state')
  it.todo('Sets erasing shapes to all shapes intersecting path while moving in erasing state')
  it.todo('Erases all erasing shapes on pointer up from erasing state')
  it.todo('Clears erasing shapes on Escape from erasing state')
  it('Transitions from idle to select.idle on Escape', () => {
    const app = new TLTestApp().selectTool('erase')
    expect(app.isIn('erase.idle')).toBe(true)
    app.keyDown('Escape')
    expect(app.isIn('select.idle')).toBe(true)
  })
})
