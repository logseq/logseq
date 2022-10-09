import path from 'path/path.js'

// TODO split the capacitor abilities to a separate file for capacitor APIs
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
      cb(nestedPath, entry)
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
      cb(nestedPath, entry)
      dirs.push(getFiles(entry, recursive, cb, nestedPath))
    }
  }
  return [(await Promise.all(dirs)), (await Promise.all(files))]
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
export const openDirectory = async (options = {}, cb) => {
  options.recursive = options.recursive || false;
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite'
  });
  const _ask = await verifyPermission(handle, true);
  return [handle, getFiles(handle, options.recursive, cb)];
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

// TODO split the capacitor clipboard to a separate file for capacitor APIs
export const writeClipboard = ({text, html}) => {
    if (typeof navigator.permissions == "undefined") {
        CapacitorClipboard.write({ string: text });
        return
    }
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

// Delegation of Path.js but unified into POXIS style
// https://nodejs.org/api/path.html#pathparsepath
// path.parse('/home/user/dir/file.txt');
// Returns:
// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
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
