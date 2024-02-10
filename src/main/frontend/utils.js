import path from 'path/path.js'

// TODO split the capacitor abilities to a separate file for capacitor APIs
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Clipboard as CapacitorClipboard } from '@capacitor/clipboard'

if (typeof window === 'undefined') {
  global.window = {}
}

// Copy from https://github.com/primetwig/react-nestable/blob/dacea9dc191399a3520f5dc7623f5edebc83e7b7/dist/utils.js
export const closest = (target, selector) => {
  // closest(e.target, '.field')
  while (target) {
    if (target.matches && target.matches(selector)) return target
    target = target.parentNode
  }
  return null
}

export const getOffsetRect = (elem) => {
  // (1)
  const box = elem.getBoundingClientRect(),
    body = document.body,
    docElem = document.documentElement,
    // (2)
    scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
    scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,

    // (3)
    clientTop = docElem.clientTop || body.clientTop || 0,
    clientLeft = docElem.clientLeft || body.clientLeft || 0,

    // (4)
    top = box.top + scrollTop - clientTop,
    left = box.left + scrollLeft - clientLeft;

  return {
    top: Math.round(top),
    left: Math.round(left)
  }
}

// jquery focus
export const focus = (elem) => {
  return elem === document.activeElement &&
    document.hasFocus() &&
    !!(elem.type || elem.href || ~elem.tabIndex)
}

// copied from https://stackoverflow.com/a/32180863
export const timeConversion = (millisec) => {
  let seconds = (millisec / 1000).toFixed(0),
    minutes = (millisec / (1000 * 60)).toFixed(0),
    hours = (millisec / (1000 * 60 * 60)).toFixed(1),
    days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

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

export const getSelectionText = () => {
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

// Modified from https://github.com/GoogleChromeLabs/browser-nativefs
// because shadow-cljs doesn't handle this babel transform
export const getFiles = async (dirHandle, recursive, cb, path = dirHandle.name) => {
  const dirs = []
  const files = []
  for await (const entry of dirHandle.values()) {
    const nestedPath = `${path}/${entry.name}`
    if (entry.kind === 'file') {
      if (cb) {
        cb(nestedPath, entry)
      }
      files.push(
        entry.getFile().then((file) => {
          Object.defineProperty(file, 'webkitRelativePath', {
            configurable: true,
            enumerable: true,
            get: () => nestedPath,
          })
          Object.defineProperty(file, 'handle', {
            configurable: true,
            enumerable: true,
            get: () => entry,
          })
          return file
        })
      )
    } else if (entry.kind === 'directory' && recursive) {
      if (cb) { cb(nestedPath, entry) }
      dirs.push(...(await getFiles(entry, recursive, cb, nestedPath)))
    }
  }
  return [...(await Promise.all(dirs)), ...(await Promise.all(files))]
}

export const verifyPermission = async (handle, readWrite) => {
  const options = {}
  if (readWrite) {
    options.mode = 'readwrite'
  }
  // Check if permission was already granted.
  if ((await handle.queryPermission(options)) === 'granted') {
    return
  }
  // Request permission. If the user grants permission, just return.
  if ((await handle.requestPermission(options)) === 'granted') {
    return
  }
  // The user didn't grant permission, throw an error.
  throw new Error('Permission is not granted')
}

// NOTE: Need externs to prevent `options.recursive` been munged
//       When building with release.
//       browser-fs-access doesn't return directory handles
//       Ref: https://github.com/GoogleChromeLabs/browser-fs-access/blob/3876499caefe8512bfcf7ce9e16c20fd10199c8b/src/fs-access/directory-open.mjs#L55-L69
export const openDirectory = async (options = {}, cb) => {
  options.recursive = options.recursive || false;
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite'
  });
  const _ask = await verifyPermission(handle, true);
  return [handle, ...(await getFiles(handle, options.recursive, cb))];
};

export const writeFile = async (fileHandle, contents) => {
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable()

  if (contents instanceof ReadableStream) {
    await contents.pipeTo(writable)
  } else {
    // Write the contents of the file to the stream.
    await writable.write(contents)
    // Close the file and write the contents to disk.
    await writable.close()
  }
}

export const nfsSupported = () => {
  if ('chooseFileSystemEntries' in self) {
    return 'chooseFileSystemEntries'
  } else if ('showOpenFilePicker' in self) {
    return 'showOpenFilePicker'
  }
  return false
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
    const event = new Event('change', {
      bubbles: true
    })

    setValue.call(node, value)
    node.dispatchEvent(event)
  }
}

// Copied from https://github.com/google/diff-match-patch/issues/29#issuecomment-647627182
export const reversePatch = patch => {
  return patch.map(patchObj => ({
    diffs: patchObj.diffs.map(([op, val]) => [
      op * -1, // The money maker
      val
    ]),
    start1: patchObj.start2,
    start2: patchObj.start1,
    length1: patchObj.length2,
    length2: patchObj.length1
  }));
};

// Copied from https://github.com/sindresorhus/path-is-absolute/blob/main/index.js
export const win32 = path => {
  // https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
  const splitDeviceRe = /^([a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?([\\/])?([\s\S]*?)$/,
    result = splitDeviceRe.exec(path),
    device = result[1] || '',
    isUnc = Boolean(device && device.charAt(1) !== ':');

  // UNC paths are always absolute
  return Boolean(result[2] || isUnc);
};

export const ios = () => {
  return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export const getClipText = (cb, errorHandler) => {
  navigator.permissions.query({
    name: "clipboard-read"
  }).then((result) => {
    if (result.state == "granted" || result.state == "prompt") {
      navigator.clipboard.readText()
        .then(text => {
          cb(text);
        })
        .catch(err => {
          errorHandler(err)
        });
    }
  })
}

export const writeClipboard = ({text, html, blocks}, ownerWindow) => {
    if (Capacitor.isNativePlatform()) {
        CapacitorClipboard.write({ string: text });
        return
    }

    const navigator = (ownerWindow || window).navigator

    navigator.permissions.query({
        name: "clipboard-write"
    }).then((result) => {
        if (result.state != "granted" && result.state != "prompt"){
            console.debug("Copy without `clipboard-write` permission:", text)
            return
        }
        let promise_written = null
        if (typeof ClipboardItem !== 'undefined') {
            let blob = new Blob([text], {
              type: ["text/plain"]
            });
            let data = [new ClipboardItem({
                ["text/plain"]: blob
            })];
            if (html) {
                let richBlob = new Blob([html], {
                    type: ["text/html"]
                })
                data = [new ClipboardItem({
                    ["text/plain"]: blob,
                    ["text/html"]: richBlob
                })];
            }
          if (blocks) {
            let blocksBlob = new Blob([blocks], {
              type: ["web application/logseq"]
            })
            let richBlob = new Blob([html], {
              type: ["text/html"]
            })
            data = [new ClipboardItem({
              ["text/plain"]: blob,
              ["text/html"]: richBlob,
              ["web application/logseq"]: blocksBlob
            })];
          }
            promise_written = navigator.clipboard.write(data)
        } else {
            console.debug("Degraded copy without `ClipboardItem` support:", text)
            promise_written = navigator.clipboard.writeText(text)
        }
        promise_written.then(() => {
            /* success */
        }).catch(e => {
            console.log(e, "fail")
        })
    })
}

export const toPosixPath = (input) => {
  return input && input.replace(/\\+/g, '/')
}

export const saveToFile = (data, fileName, format) => {
  if (!data) return
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.${format}`
  link.click()
}

export const canvasToImage = (canvas, title = 'Untitled', format = 'png') => {
  canvas.toBlob(
    (blob) => {
      console.log(blob)
      saveToFile(blob, title, format)
    },
    `image/.${format}`
  )
}

export const nodePath = Object.assign({}, path, {
  basename (input) {
    input = toPosixPath(input)
    return path.basename(input)
  },

  name (input) {
    input = toPosixPath(input)
    return path.parse(input).name
  },

  dirname (input) {
    input = toPosixPath(input)
    return path.dirname(input)
  },

  extname (input) {
    input = toPosixPath(input)
    return path.extname(input)
  },

  join (input, ...paths) {
    let orURI = null
    const s = [
      'file://', 'http://',
      'https://', 'content://'
    ]

    if (s.some(p => input.startsWith(p))) {
      try {
        orURI = new URL(input)
        input = input.replace(orURI.protocol + '//', '')
          .replace(orURI.protocol, '')
          .replace(/^\/+/, '/')
      } catch (_e) {}
    }

    input = path.join(input, ...paths)

    return (orURI ? (orURI.protocol + '//') : '') + input
  }
})

// https://stackoverflow.com/questions/376373/pretty-printing-xml-with-javascript
export const prettifyXml = (sourceXml) => {
  const xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml')
  const xsltDoc = new DOMParser().parseFromString([
    // describes how we want to modify the XML - indent everything
    '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
    '  <xsl:strip-space elements="*"/>',
    '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
    '    <xsl:value-of select="normalize-space(.)"/>',
    '  </xsl:template>',
    '  <xsl:template match="node()|@*">',
    '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
    '  </xsl:template>',
    '  <xsl:output indent="yes"/>',
    '</xsl:stylesheet>',
  ].join('\n'), 'application/xml')

  const xsltProcessor = new XSLTProcessor()
  xsltProcessor.importStylesheet(xsltDoc)
  const resultDoc = xsltProcessor.transformToDocument(xmlDoc)
  const resultXml = new XMLSerializer().serializeToString(resultDoc)
  // if it has parsererror, then return the original text
  return resultXml.indexOf('<parsererror') === -1 ? resultXml : sourceXml
}

export const elementIsVisibleInViewport = (el, partiallyVisible = false) => {
  const { top, left, bottom, right } = el.getBoundingClientRect()
  const { innerHeight, innerWidth } = window
  return partiallyVisible
    ? ((top > 0 && top < innerHeight) ||
      (bottom > 0 && bottom < innerHeight)) &&
    ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
    : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth
}

export const convertToLetters = (num) => {
  if (!+num) return false
  let s = '', t

  while (num > 0) {
    t = (num - 1) % 26
    s = String.fromCharCode(65 + t) + s
    num = ((num - t) / 26) | 0
  }

  return s
}

export const convertToRoman = (num) => {
  if (!+num) return false
  const digits = String(+num).split('')
  const key = ['','C','CC','CCC','CD','D','DC','DCC','DCCC','CM',
    '','X','XX','XXX','XL','L','LX','LXX','LXXX','XC',
    '','I','II','III','IV','V','VI','VII','VIII','IX']
  let roman = '', i = 3
  while (i--) roman = (key[+digits.pop() + i * 10] || '') + roman
  return Array(+digits.join('') + 1).join('M') + roman
}

export function hsl2hex(h, s, l, alpha) {
  l /= 100
  const a = s * Math.min(l, 1 - l) / 100
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
    // convert to Hex and prefix "0" if needed
  }

  //alpha conversion
  if (alpha) {
    alpha = Math.round(alpha * 255).toString(16).padStart(2, '0')
  } else {
    alpha = ''
  }

  return `#${f(0)}${f(8)}${f(4)}${alpha}`
}
