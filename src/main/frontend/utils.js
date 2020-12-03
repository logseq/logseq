if (typeof window === 'undefined') {
  global.window = {}
}

// Copy from https://github.com/primetwig/react-nestable/blob/dacea9dc191399a3520f5dc7623f5edebc83e7b7/dist/utils.js
export var closest = function closest (target, selector) {
  // closest(e.target, '.field')
  while (target) {
    if (target.matches && target.matches(selector)) return target
    target = target.parentNode
  }
  return null
}

export var getOffsetRect = function getOffsetRect (elem) {
  // (1)
  var box = elem.getBoundingClientRect()

  var body = document.body
  var docElem = document.documentElement

  // (2)
  var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
  var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

  // (3)
  var clientTop = docElem.clientTop || body.clientTop || 0
  var clientLeft = docElem.clientLeft || body.clientLeft || 0

  // (4)
  var top = box.top + scrollTop - clientTop
  var left = box.left + scrollLeft - clientLeft

  return { top: Math.round(top), left: Math.round(left) }
}

// jquery focus
export var focus = function (elem) {
  return elem === document.activeElement &&
    document.hasFocus() &&
    !!(elem.type || elem.href || ~elem.tabIndex)
}

// copied from https://stackoverflow.com/a/32180863
export var timeConversion = function (millisec) {
  var seconds = (millisec / 1000).toFixed(0)
  var minutes = (millisec / (1000 * 60)).toFixed(0)
  var hours = (millisec / (1000 * 60 * 60)).toFixed(1)
  var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1)

  if (seconds < 60) {
    return seconds + 's'
  } else if (minutes < 60) {
    return minutes + 'm'
  } else if (hours < 24) {
    return hours + 'h'
  } else {
    return days + 'd'
  }
}

export var getSelectionText = function () {
  const selection = (window.getSelection() || '').toString().trim()
  if (selection) {
    return selection
  }

  // Firefox fix
  const activeElement = window.document.activeElement
  if (activeElement) {
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      const el = activeElement
      return el.value.slice(el.selectionStart || 0, el.selectionEnd || 0)
    }
  }

  return ''
}

const inputTypes = [
  window.HTMLInputElement,
  window.HTMLSelectElement,
  window.HTMLTextAreaElement,
]

export const triggerInputChange = (node, value = '', name = 'change') => {

  // only process the change on elements we know have a value setter in their constructor
  if (inputTypes.indexOf(node.__proto__.constructor) > -1) {

    const setValue = Object.getOwnPropertyDescriptor(node.__proto__, 'value').set
    const event = new Event('change', { bubbles: true })

    setValue.call(node, value)
    node.dispatchEvent(event)
  }
}
