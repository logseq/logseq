import { SettingSchemaDesc, StyleString, UIOptions } from './LSPlugin'
import { PluginLocal } from './LSPlugin.core'
import * as nodePath from 'path'
import DOMPurify from 'dompurify'
import merge from 'deepmerge'
import { snakeCase } from 'snake-case'
import * as callables from './callable.apis'
import EventEmitter from 'eventemitter3'

declare global {
  interface Window {
    api: any
    apis: any
  }
}

export const path =
  navigator.platform.toLowerCase() === 'win32' ? nodePath.win32 : nodePath.posix
export const IS_DEV = process.env.NODE_ENV === 'development'
export const PROTOCOL_FILE = 'file://'
export const PROTOCOL_LSP = 'lsp://'
export const URL_LSP = PROTOCOL_LSP + 'logseq.io/'

let _appPathRoot

// TODO: snakeCase of lodash is incompatible with `snake-case`
export const safeSnakeCase = snakeCase

export async function getAppPathRoot(): Promise<string> {
  if (_appPathRoot) {
    return _appPathRoot
  }

  return (_appPathRoot = await invokeHostExportedApi(
    '_callApplication',
    'getAppPath'
  ))
}

export async function getSDKPathRoot(): Promise<string> {
  if (IS_DEV) {
    // TODO: cache in preference file
    return localStorage.getItem('LSP_DEV_SDK_ROOT') || 'http://localhost:8080'
  }

  const appPathRoot = await getAppPathRoot()

  return safetyPathJoin(appPathRoot, 'js')
}

export function isObject(item: any) {
  return item === Object(item) && !Array.isArray(item)
}

export function deepMerge<T>(a: Partial<T>, b: Partial<T>): T {
  const overwriteArrayMerge = (destinationArray, sourceArray) => sourceArray
  return merge(a, b, { arrayMerge: overwriteArrayMerge })
}

export class PluginLogger extends EventEmitter<'change'> {
  private _logs: Array<[type: string, payload: any]> = []

  constructor(
    private _tag?: string,
    private _opts?: {
      console: boolean
    }
  ) {
    super()
  }

  write(type: string, payload: any[], inConsole?: boolean) {
    if (payload?.length && true === payload[payload.length - 1]) {
      inConsole = true
      payload.pop()
    }

    const msg = payload.reduce((ac, it) => {
      if (it && it instanceof Error) {
        ac += `${it.message} ${it.stack}`
      } else {
        ac += it.toString()
      }
      return ac
    }, `[${this._tag}][${new Date().toLocaleTimeString()}] `)

    this._logs.push([type, msg])

    if (inConsole || this._opts?.console) {
      console?.['ERROR' === type ? 'error' : 'debug'](`${type}: ${msg}`)
    }

    this.emit('change')
  }

  clear() {
    this._logs = []
    this.emit('change')
  }

  info(...args: any[]) {
    this.write('INFO', args)
  }

  error(...args: any[]) {
    this.write('ERROR', args)
  }

  warn(...args: any[]) {
    this.write('WARN', args)
  }

  setTag(s: string) {
    this._tag = s
  }

  toJSON() {
    return this._logs
  }
}

export function isValidUUID(s: string) {
  return (
    typeof s === 'string' &&
    s.length === 36 &&
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi.test(
      s
    )
  )
}

export function genID() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9)
}

export function ucFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function withFileProtocol(path: string) {
  if (!path) return ''
  const reg = /^(http|file|lsp)/

  if (!reg.test(path)) {
    path = PROTOCOL_FILE + path
  }

  return path
}

export function safetyPathJoin(basePath: string, ...parts: Array<string>) {
  try {
    const url = new URL(basePath)
    if (!url.origin) throw new Error(null)
    const fullPath = path.join(basePath.substr(url.origin.length), ...parts)
    return url.origin + fullPath
  } catch (e) {
    return path.join(basePath, ...parts)
  }
}

export function safetyPathNormalize(basePath: string) {
  if (!basePath?.match(/^(http?|lsp|assets):/)) {
    basePath = path.normalize(basePath)
  }
  return basePath
}

/**
 * @param timeout milliseconds
 * @param tag string
 */
export function deferred<T = any>(timeout?: number, tag?: string) {
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
      timeout = setTimeout(
        () => reject(new Error(`[deferred timeout] ${tag}`)),
        timeout
      )
    }
  })

  return {
    created: Date.now(),
    setTag: (t: string) => (tag = t),
    resolve,
    reject,
    promise,
    get settled() {
      return settled
    },
  }
}

export function invokeHostExportedApi(method: string, ...args: Array<any>) {
  method = method?.startsWith('_call') ? method : method?.replace(/^[_$]+/, '')
  let method1 = safeSnakeCase(method)

  // @ts-ignore
  const nsSDK = window.logseq?.sdk
  const supportedNS = nsSDK && Object.keys(nsSDK)
  let nsTarget = {}
  const ns0 = method1?.split('_')?.[0]

  if (ns0 && supportedNS.includes(ns0)) {
    method1 = method1.replace(new RegExp(`^${ns0}_`), '')
    nsTarget = nsSDK?.[ns0]
  }

  const logseqHostExportedApi = Object.assign(
    // @ts-ignore
    {}, window.logseq?.api,
    nsTarget, callables
  )

  const fn =
    logseqHostExportedApi[method1] ||
    window.apis[method1] ||
    logseqHostExportedApi[method] ||
    window.apis[method]

  if (!fn) {
    throw new Error(`Not existed method #${method}`)
  }
  return typeof fn !== 'function' ? fn : fn.apply(this, args)
}

export function setupIframeSandbox(
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

export function setupInjectedStyle(
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

  attrs &&
  Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })

  document.head.append(el)

  return () => {
    document.head.removeChild(el)
  }
}

const injectedUIEffects = new Map<string, () => void>()

// @ts-ignore
window.__injectedUIEffects = injectedUIEffects

export function setupInjectedUI(
  this: PluginLocal,
  ui: UIOptions,
  attrs: Record<string, string>,
  initialCallback?: (e: { el: HTMLElement; float: boolean }) => void
) {
  let slot: string = ''
  let selector: string
  let float: boolean

  const pl = this

  if ('slot' in ui) {
    slot = ui.slot
    selector = `#${slot}`
  } else if ('path' in ui) {
    selector = ui.path
  } else {
    float = true
  }

  const id = `${pl.id}--${ui.key || genID()}`
  const key = id

  const target = float
    ? document.body
    : selector && document.querySelector(selector)
  if (!target) {
    console.error(
      `${this.debugTag} can not resolve selector target ${selector}`
    )
    return false
  }

  if (ui.template) {
    // safe template
    ui.template = DOMPurify.sanitize(ui.template, {
      ADD_TAGS: ['iframe'],
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ADD_ATTR: [
        'allow',
        'src',
        'allowfullscreen',
        'frameborder',
        'scrolling',
        'target',
      ],
    })
  } else {
    // remove ui
    injectedUIEffects.get(id)?.call(null)
    return
  }

  let el = document.querySelector(`#${id}`) as HTMLElement
  let content = float ? el?.querySelector('.ls-ui-float-content') : el

  if (content) {
    content.innerHTML = ui.template

    // update attributes
    attrs &&
    Object.entries(attrs).forEach(([k, v]) => {
      el.setAttribute(k, v)
    })

    let positionDirty = el.dataset.dx != null
    ui.style &&
    Object.entries(ui.style).forEach(([k, v]) => {
      if (
        positionDirty &&
        ['left', 'top', 'bottom', 'right', 'width', 'height'].includes(k)
      ) {
        return
      }

      el.style[k] = v
    })
    return
  }

  el = document.createElement('div')
  el.id = id
  el.dataset.injectedUi = key || ''

  if (float) {
    content = document.createElement('div')
    content.classList.add('ls-ui-float-content')
    el.appendChild(content)
  } else {
    content = el
  }

  // TODO: enhance template
  content.innerHTML = ui.template

  attrs &&
  Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })

  ui.style &&
  Object.entries(ui.style).forEach(([k, v]) => {
    el.style[k] = v
  })

  let teardownUI: () => void
  let disposeFloat: () => void

  // seu up float container
  if (float) {
    el.setAttribute('draggable', 'true')
    el.setAttribute('resizable', 'true')
    ui.close && (el.dataset.close = ui.close)
    el.classList.add('lsp-ui-float-container', 'visible')
    disposeFloat =
      (pl._setupResizableContainer(el, key),
        pl._setupDraggableContainer(el, {
          key,
          close: () => teardownUI(),
          title: attrs?.title,
        }))
  }

  if (!!slot && ui.reset) {
    const exists = Array.from(
      target.querySelectorAll('[data-injected-ui]')
    ).map((it: HTMLElement) => it.id)

    exists?.forEach((exist: string) => {
      injectedUIEffects.get(exist)?.call(null)
    })
  }

  target.appendChild(el)

  // TODO: How handle events
  ;[
    'click',
    'focus',
    'focusin',
    'focusout',
    'blur',
    'dblclick',
    'keyup',
    'keypress',
    'keydown',
    'change',
    'input',
    'contextmenu',
  ].forEach((type) => {
    el.addEventListener(
      type,
      (e) => {
        const target = e.target! as HTMLElement
        const trigger = target.closest(`[data-on-${type}]`) as HTMLElement
        if (!trigger) return

        const { preventDefault } = trigger.dataset
        const msgType = trigger.dataset[`on${ucFirst(type)}`]
        if (msgType)
          pl.caller?.callUserModel(msgType, transformableEvent(trigger, e))
        if (preventDefault?.toLowerCase() === 'true') e.preventDefault()
      },
      false
    )
  })

  // callback
  initialCallback?.({ el, float })

  teardownUI = () => {
    disposeFloat?.()
    injectedUIEffects.delete(id)
    target!.removeChild(el)
  }

  injectedUIEffects.set(id, teardownUI)
  return teardownUI
}

export function cleanInjectedUI(id: string) {
  if (!injectedUIEffects.has(id)) return
  const clean = injectedUIEffects.get(id)
  try {
    clean()
  } catch (e) {
    console.warn('[CLEAN Injected UI] ', id, e)
  }
}

export function cleanInjectedScripts(this: PluginLocal) {
  const scripts = document.head.querySelectorAll(`script[data-ref=${this.id}]`)

  scripts?.forEach((it) => it.remove())
}

export function transformableEvent(target: HTMLElement, e: Event) {
  const obj: any = {}

  if (target) {
    obj.type = e.type

    const ds = target.dataset
    const FLAG_RECT = 'rect'

    ;['value', 'id', 'className', 'dataset', FLAG_RECT].forEach((k) => {
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

export function injectTheme(url: string) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)

  const ejectTheme = () => {
    try {
      document.head.removeChild(link)
    } catch (e) {
      console.error(e)
    }
  }

  return ejectTheme
}

export function mergeSettingsWithSchema(
  settings: Record<string, any>,
  schema: Array<SettingSchemaDesc>
) {
  const defaults = (schema || []).reduce((a, b) => {
    if ('default' in b) {
      a[b.key] = b.default
    }
    return a
  }, {})

  // shadow copy
  return Object.assign(defaults, settings)
}

export function normalizeKeyStr(s: string) {
  if (typeof s !== 'string') return
  return s.trim().replace(/\s/g, '_').toLowerCase()
}
