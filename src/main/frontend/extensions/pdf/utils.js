/**
 * @returns {*}
 */
export const getPdfjsLib = () => {
  return window.pdfjsLib
}

export const viewportToScaled = (
  rect,
  { width, height }
) => {
  return {
    x1: rect.left,
    y1: rect.top,

    x2: rect.left + rect.width,
    y2: rect.top + rect.height,

    width,
    height,
  }
}

const pdfToViewport = (pdf, viewport) => {
  const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([
    pdf.x1,
    pdf.y1,
    pdf.x2,
    pdf.y2,
  ])

  return {
    left: x1,
    top: y1,

    width: x2 - x1,
    height: y1 - y2,
  }
}

export const scaledToViewport = (
  scaled,
  viewport,
  usePdfCoordinates = false
) => {
  const { width, height } = viewport

  if (usePdfCoordinates) {
    return pdfToViewport(scaled, viewport)
  }

  if (scaled.x1 === undefined) {
    throw new Error('You are using old position format, please update')
  }

  const x1 = (width * scaled.x1) / scaled.width
  const y1 = (height * scaled.y1) / scaled.height

  const x2 = (width * scaled.x2) / scaled.width
  const y2 = (height * scaled.y2) / scaled.height

  return {
    left: x1,
    top: y1,
    width: x2 - x1,
    height: y2 - y1,
  }
}

export const getBoundingRect = (clientRects) => {
  const rects = Array.from(clientRects).map(rect => {
    const { left, top, width, height } = rect

    const X0 = left
    const X1 = left + width

    const Y0 = top
    const Y1 = top + height

    return { X0, X1, Y0, Y1 }
  })

  const optimal = rects.reduce((res, rect) => {
    return {
      X0: Math.min(res.X0, rect.X0),
      X1: Math.max(res.X1, rect.X1),

      Y0: Math.min(res.Y0, rect.Y0),
      Y1: Math.max(res.Y1, rect.Y1),
    }
  }, rects[0])

  const { X0, X1, Y0, Y1 } = optimal

  return {
    left: X0,
    top: Y0,
    width: X1 - X0,
    height: Y1 - Y0,
  }
}

export const scrollToHighlight = (viewer, highlight) => {
  if (!highlight) return
  const { page, bounding } = highlight.position
  const viewport = viewer.getPageView(page - 1)?.viewport
  if (!viewport) return

  viewer.scrollPageIntoView({
    pageNumber: page,
    destArray: [
      null, { name: 'XYZ' },
      ...viewport.convertToPdfPoint(
        viewer.container.scrollLeft,
        scaledToViewport(bounding, viewport).top - 200),
      viewer.currentScale // scale
    ],
    ignoreDestinationZoom: true
  })

  setTimeout(blinkHighlight, 200)

  // blink highlight
  function blinkHighlight () {
    const id = highlight?.id
    const el = document.getElementById(`hl_${id}`)
    if (!el) return
    el.classList.add('hl-flash')
    setTimeout(() => el?.classList.remove('hl-flash'), 1200)
  }
}

export const optimizeClientRects = (clientRects) => {
  const sort = rects =>
    rects.sort((A, B) => {
      const top = A.top - B.top

      if (top === 0) {
        return A.left - B.left
      }

      return top
    })

  const overlaps = (A, B) => A.left <= B.left && B.left <= A.left + A.width
  const sameLine = (A, B, yMargin = 5) =>
    Math.abs(A.top - B.top) < yMargin && Math.abs(A.height - B.height) < yMargin

  const inside = (A, B) =>
    A.top > B.top &&
    A.left > B.left &&
    A.top + A.height < B.top + B.height &&
    A.left + A.width < B.left + B.width

  const nextTo = (A, B, xMargin = 10) => {
    const Aright = A.left + A.width
    const Bright = B.left + B.width

    return A.left <= B.left && Aright <= Bright && B.left - Aright <= xMargin
  }
  const extendWidth = (A, B) => {
    // extend width of A to cover B
    A.width = Math.max(B.width - A.left + B.left, A.width)
  }

  const rects = sort(clientRects)
  const toRemove = new Set()

  const firstPass = rects.filter(rect => {
    return rects.every(otherRect => {
      return !inside(rect, otherRect)
    })
  })

  let passCount = 0

  while (passCount <= 2) {
    firstPass.forEach(A => {
      firstPass.forEach(B => {
        if (A === B || toRemove.has(A) || toRemove.has(B)) {
          return
        }

        if (!sameLine(A, B)) {
          return
        }

        if (overlaps(A, B)) {
          extendWidth(A, B)
          A.height = Math.max(A.height, B.height)

          toRemove.add(B)
        }

        if (nextTo(A, B)) {
          extendWidth(A, B)

          toRemove.add(B)
        }
      })
    })
    passCount += 1
  }

  return firstPass.filter(rect => !toRemove.has(rect))
}

/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @returns {number} Index of the first array element to pass the test,
 * or |items.length| if no such element exists.
 */
export function binarySearchFirstItem (items, condition, start = 0) {
  let minIndex = start
  let maxIndex = items.length - 1

  if (maxIndex < 0 || !condition(items[maxIndex])) {
    return items.length
  }
  if (condition(items[minIndex])) {
    return minIndex
  }

  while (minIndex < maxIndex) {
    const currentIndex = (minIndex + maxIndex) >> 1
    const currentItem = items[currentIndex]
    if (condition(currentItem)) {
      maxIndex = currentIndex
    } else {
      minIndex = currentIndex + 1
    }
  }
  return minIndex /* === maxIndex */
}

/**
 * Scrolls specified element into view of its parent.
 * @param {Object} element - The element to be visible.
 * @param {Object} spot - An object with optional top and left properties,
 *   specifying the offset from the top left edge.
 * @param {boolean} [scrollMatches] - When scrolling search results into view,
 *   ignore elements that either: Contains marked content identifiers,
 *   or have the CSS-rule `overflow: hidden;` set. The default value is `false`.
 */
function scrollIntoView (element, spot, scrollMatches = false) {
  // Assuming offsetParent is available (it's not available when viewer is in
  // hidden iframe or object). We have to scroll: if the offsetParent is not set
  // producing the error. See also animationStarted.
  let parent = element.offsetParent
  if (!parent) {
    console.error('offsetParent is not set -- cannot scroll')
    return
  }
  let offsetY = element.offsetTop + element.clientTop
  let offsetX = element.offsetLeft + element.clientLeft
  while (
    (parent.clientHeight === parent.scrollHeight &&
      parent.clientWidth === parent.scrollWidth) ||
    (scrollMatches &&
      (parent.classList.contains('markedContent') ||
        getComputedStyle(parent).overflow === 'hidden'))
    ) {
    offsetY += parent.offsetTop
    offsetX += parent.offsetLeft

    parent = parent.offsetParent
    if (!parent) {
      return // no need to scroll
    }
  }
  if (spot) {
    if (spot.top !== undefined) {
      offsetY += spot.top
    }
    if (spot.left !== undefined) {
      offsetX += spot.left
      parent.scrollLeft = offsetX
    }
  }
  parent.scrollTop = offsetY
}

export const CharacterType = {
  SPACE: 0,
  ALPHA_LETTER: 1,
  PUNCT: 2,
  HAN_LETTER: 3,
  KATAKANA_LETTER: 4,
  HIRAGANA_LETTER: 5,
  HALFWIDTH_KATAKANA_LETTER: 6,
  THAI_LETTER: 7,
}

function isAlphabeticalScript (charCode) {
  return charCode < 0x2e80
}

function isAscii (charCode) {
  return (charCode & 0xff80) === 0
}

function isAsciiAlpha (charCode) {
  return (
    (charCode >= /* a = */ 0x61 && charCode <= /* z = */ 0x7a) ||
    (charCode >= /* A = */ 0x41 && charCode <= /* Z = */ 0x5a)
  )
}

function isAsciiDigit (charCode) {
  return charCode >= /* 0 = */ 0x30 && charCode <= /* 9 = */ 0x39
}

function isAsciiSpace (charCode) {
  return (
    charCode === /* SPACE = */ 0x20 ||
    charCode === /* TAB = */ 0x09 ||
    charCode === /* CR = */ 0x0d ||
    charCode === /* LF = */ 0x0a
  )
}

function isHan (charCode) {
  return (
    (charCode >= 0x3400 && charCode <= 0x9fff) ||
    (charCode >= 0xf900 && charCode <= 0xfaff)
  )
}

function isKatakana (charCode) {
  return charCode >= 0x30a0 && charCode <= 0x30ff
}

function isHiragana (charCode) {
  return charCode >= 0x3040 && charCode <= 0x309f
}

function isHalfwidthKatakana (charCode) {
  return charCode >= 0xff60 && charCode <= 0xff9f
}

function isThai (charCode) {
  return (charCode & 0xff80) === 0x0e00
}

/**
 * This function is based on the word-break detection implemented in:
 * https://hg.mozilla.org/mozilla-central/file/tip/intl/lwbrk/WordBreaker.cpp
 */
export function getCharacterType (charCode) {
  if (isAlphabeticalScript(charCode)) {
    if (isAscii(charCode)) {
      if (isAsciiSpace(charCode)) {
        return CharacterType.SPACE
      } else if (
        isAsciiAlpha(charCode) ||
        isAsciiDigit(charCode) ||
        charCode === /* UNDERSCORE = */ 0x5f
      ) {
        return CharacterType.ALPHA_LETTER
      }
      return CharacterType.PUNCT
    } else if (isThai(charCode)) {
      return CharacterType.THAI_LETTER
    } else if (charCode === /* NBSP = */ 0xa0) {
      return CharacterType.SPACE
    }
    return CharacterType.ALPHA_LETTER
  }

  if (isHan(charCode)) {
    return CharacterType.HAN_LETTER
  } else if (isKatakana(charCode)) {
    return CharacterType.KATAKANA_LETTER
  } else if (isHiragana(charCode)) {
    return CharacterType.HIRAGANA_LETTER
  } else if (isHalfwidthKatakana(charCode)) {
    return CharacterType.HALFWIDTH_KATAKANA_LETTER
  }
  return CharacterType.ALPHA_LETTER
}