import test from 'node:test'
import assert from 'node:assert/strict'

import { scrollIntoView } from '../../../src/main/frontend/extensions/pdf/scroll.mjs'

const classList = (...classes) => ({
  contains: (className) => classes.includes(className),
})

const element = ({
  classNames = [],
  offsetParent = null,
  offsetTop = 0,
  offsetLeft = 0,
  clientTop = 0,
  clientLeft = 0,
  clientHeight = 100,
  scrollHeight = 200,
  clientWidth = 100,
  scrollWidth = 200,
} = {}) => ({
  classList: classList(...classNames),
  offsetParent,
  offsetTop,
  offsetLeft,
  clientTop,
  clientLeft,
  clientHeight,
  scrollHeight,
  clientWidth,
  scrollWidth,
  scrollTop: 0,
  scrollLeft: 0,
})

test('scrollIntoView scrolls the nearest scrollable parent with offsets', () => {
  const scroller = element()
  const target = element({
    offsetParent: scroller,
    offsetTop: 40,
    offsetLeft: 70,
    clientTop: 2,
    clientLeft: 3,
  })

  scrollIntoView(target, { top: -10, left: -20 }, true)

  assert.equal(scroller.scrollTop, 32)
  assert.equal(scroller.scrollLeft, 53)
})

test('scrollIntoView skips hidden match wrappers when finding the scrollable parent', () => {
  const scroller = element()
  const hiddenWrapper = element({
    classNames: ['markedContent'],
    offsetParent: scroller,
    offsetTop: 100,
    offsetLeft: 30,
  })
  const target = element({
    offsetParent: hiddenWrapper,
    offsetTop: 20,
    offsetLeft: 10,
  })
  const originalGetComputedStyle = globalThis.getComputedStyle
  globalThis.getComputedStyle = (node) => ({
    overflow: node === hiddenWrapper ? 'hidden' : 'visible',
  })

  try {
    scrollIntoView(target, { top: -50, left: -400 }, true)
  } finally {
    globalThis.getComputedStyle = originalGetComputedStyle
  }

  assert.equal(hiddenWrapper.scrollTop, 0)
  assert.equal(scroller.scrollTop, 70)
  assert.equal(scroller.scrollLeft, -360)
})
