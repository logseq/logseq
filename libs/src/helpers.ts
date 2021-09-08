import { StyleString, UIOptions } from './LSPlugin'
import { PluginLocal } from './LSPlugin.core'
import { snakeCase } from 'snake-case'
import * as nodePath from 'path'

interface IObject {
  [key: string]: any;
}

declare global {
  interface Window {
    api: any
    apis: any
  }
}

export const path = navigator.platform.toLowerCase() === 'win32' ? nodePath.win32 : nodePath.posix
export const IS_DEV = process.env.NODE_ENV === 'development'
export const PROTOCOL_FILE = 'file://'
export const PROTOCOL_LSP = 'lsp://'
export const URL_LSP = PROTOCOL_LSP + 'logseq.io/'

let _appPathRoot

export async function getAppPathRoot (): Promise<string> {
  if (_appPathRoot) {
    return _appPathRoot
  }

  return (_appPathRoot =
      await invokeHostExportedApi('_callApplication', 'getAppPath')
  )
}

export async function getSDKPathRoot (): Promise<string> {
  if (IS_DEV) {
    // TODO: cache in preference file
    return localStorage.getItem('LSP_DEV_SDK_ROOT') || 'http://localhost:8080'
  }

  const appPathRoot = await getAppPathRoot()

  return safetyPathJoin(appPathRoot, 'js')
}

export function isObject (item: any) {
  return (item === Object(item) && !Array.isArray(item))
}

export function deepMerge (
  target: IObject,
  ...sources: Array<IObject>
) {
  // return the target if no sources passed
  if (!sources.length) {
    return target
  }

  const result: IObject = target

  if (isObject(result)) {
    const len: number = sources.length

    for (let i = 0; i < len; i += 1) {
      const elm: any = sources[i]

      if (isObject(elm)) {
        for (const key in elm) {
          if (elm.hasOwnProperty(key)) {
            if (isObject(elm[key])) {
              if (!result[key] || !isObject(result[key])) {
                result[key] = {}
              }
              deepMerge(result[key], elm[key])
            } else {
              if (Array.isArray(result[key]) && Array.isArray(elm[key])) {
                // concatenate the two arrays and remove any duplicate primitive values
                result[key] = Array.from(new Set(result[key].concat(elm[key])))
              } else {
                result[key] = elm[key]
              }
            }
          }
        }
      }
    }
  }

  return result
}

export function genID () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9)
}

export function ucFirst (str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function withFileProtocol (path: string) {
  if (!path) return ''
  const reg = /^(http|file|lsp)/

  if (!reg.test(path)) {
    path = PROTOCOL_FILE + path
  }

  return path
}

export function safetyPathJoin (basePath: string, ...parts: Array<string>) {
  try {
    const url = new URL(basePath)
    if (!url.origin) throw new Error(null)
    const fullPath = path.join(basePath.substr(url.origin.length), ...parts)
    return url.origin + fullPath
  } catch (e) {
    return path.join(basePath, ...parts)
  }
}

export function safetyPathNormalize (basePath: string) {
  if (!basePath?.match(/^(http?|lsp|assets):/)) {
    basePath = path.normalize(basePath)
  }
  return basePath
}

/**
 * @param timeout milliseconds
 * @param tag string
 */
export function deferred<T = any> (timeout?: number, tag?: string) {
  let resolve: any, reject: any
  let settled = false
  const timeFn = (r: Function) => {
    return (v: T) => {
      timeout && clearTimeout(timeout)
      r(v)
      settled = true
    }
  }

  const promise = new Promise<T>((resolve1, reject1) => {
    resolve = timeFn(resolve1)
    reject = timeFn(reject1)

    if (timeout) {
      // @ts-ignore
      timeout = setTimeout(() => reject(new Error(`[deferred timeout] ${tag}`)), timeout)
    }
  })

  return {
    created: Date.now(),
    setTag: (t: string) => tag = t,
    resolve, reject, promise,
    get settled () {
      return settled
    }
  }
}

export function invokeHostExportedApi (
  method: string,
  ...args: Array<any>
) {
  method = method?.replace(/^[_$]+/, '')
  const method1 = snakeCase(method)

  // @ts-ignore
  const logseqHostExportedApi = window.logseq?.api || {}

  const fn = logseqHostExportedApi[method1] || window.apis[method1] ||
    logseqHostExportedApi[method] || window.apis[method]

  if (!fn) {
    throw new Error(`Not existed method #${method}`)
  }
  return typeof fn !== 'function' ? fn : fn.apply(null, args)
}

export function setupIframeSandbox (
  props: Record<string, any>,
  target: HTMLElement
) {
  const iframe = document.createElement('iframe')

  iframe.classList.add('lsp-iframe-sandbox')

  Object.entries(props).forEach(([k, v]) => {
    iframe.setAttribute(k, v)
  })

  target.appendChild(iframe)

  return async () => {
    target.removeChild(iframe)
  }
}

export function setupInjectedStyle (
  style: StyleString,
  attrs: Record<string, any>
) {
  const key = attrs['data-injected-style']
  let el = key && document.querySelector(`[data-injected-style=${key}]`)

  if (el) {
    el.textContent = style
    return
  }

  el = document.createElement('style')
  el.textContent = style

  attrs && Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })

  document.head.append(el)

  return () => {
    document.head.removeChild(el)
  }
}

export function setupInjectedUI (
  this: PluginLocal,
  ui: UIOptions,
  attrs: Record<string, any>
) {
  const pl = this
  let slot = ''
  let selector = ''

  if ('slot' in ui) {
    slot = ui.slot
    selector = `#${slot}`
  } else {
    selector = ui.path
  }

  const target = selector && document.querySelector(selector)
  if (!target) {
    console.error(`${this.debugTag} can not resolve selector target ${selector}`)
    return
  }

  const id = `${ui.key}-${slot}-${pl.id}`
  const key = `${ui.key}-${pl.id}`

  let el = document.querySelector(`#${id}`) as HTMLElement

  if (el) {
    el.innerHTML = ui.template
    return
  }

  el = document.createElement('div')
  el.id = id
  el.dataset.injectedUi = key || ''

  // TODO: Support more
  el.innerHTML = ui.template

  attrs && Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })

  target.appendChild(el);

  // TODO: How handle events
  ['click', 'focus', 'focusin', 'focusout', 'blur', 'dblclick',
    'keyup', 'keypress', 'keydown', 'change', 'input'].forEach((type) => {
    el.addEventListener(type, (e) => {
      const target = e.target! as HTMLElement
      const trigger = target.closest(`[data-on-${type}]`) as HTMLElement
      if (!trigger) return

      const msgType = trigger.dataset[`on${ucFirst(type)}`]
      msgType && pl.caller?.callUserModel(msgType, transformableEvent(trigger, e))
    }, false)
  })

  return () => {
    target!.removeChild(el)
  }
}

export function transformableEvent (target: HTMLElement, e: Event) {
  const obj: any = {}

  if (target) {
    const ds = target.dataset
    const FLAG_RECT = 'rect'

    ;['value', 'id', 'className',
      'dataset', FLAG_RECT
    ].forEach((k) => {
      let v: any

      switch (k) {
        case FLAG_RECT:
          if (!ds.hasOwnProperty(FLAG_RECT)) return
          v = target.getBoundingClientRect().toJSON()
          break
        default:
          v = target[k]
      }

      if (typeof v === 'object') {
        v = { ...v }
      }

      obj[k] = v
    })
  }

  return obj
}

let injectedThemeEffect: any = null

export function setupInjectedTheme (url?: string) {
  injectedThemeEffect?.call()

  if (!url) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)

  return (injectedThemeEffect = () => {
    try {
      document.head.removeChild(link)
    } catch (e) {
      console.error(e)
    }
    injectedThemeEffect = null
  })
}
