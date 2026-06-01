export function scrollIntoView (element, spot, scrollMatches = false) {
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
        (typeof getComputedStyle === 'function' &&
          getComputedStyle(parent).overflow === 'hidden')))
  ) {
    offsetY += parent.offsetTop
    offsetX += parent.offsetLeft
    parent = parent.offsetParent
    if (!parent) {
      return
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
