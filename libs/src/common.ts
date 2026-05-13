import { SettingSchemaDesc, StyleString, UIOptions } from './LSPlugin'
import { PluginLocal } from './LSPlugin.core'
import * as nodePath from 'path'
import DOMPurify from 'dompurify'
import merge from 'deepmerge'
import { snakeCase } from 'change-case'
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

let _appPathRoot: string

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

export type PluginLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface PluginLogEntry {
  ts: number
  level: PluginLogLevel
  tag: string
  message: string
}

export interface PluginLoggerOptions {
  console?: boolean
  maxSize?: number
  level?: PluginLogLevel
}

const LOG_LEVEL_WEIGHT: Record<PluginLogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
}

const DEFAULT_LOG_MAX_SIZE = 500

function safeStringifyArg(it: any): string {
  if (it == null) return String(it)
  if (it instanceof Error) return `${it.message}${it.stack ? '\n' + it.stack : ''}`
  if (typeof it === 'string') return it
  if (typeof it === 'object') {
    try {
      const seen = new WeakSet()
      return JSON.stringify(it, (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]'
          seen.add(v)
        }
        return v
      })
    } catch (_e) {
      try { return String(it) } catch (_) { return '[Unserializable]' }
    }
  }
  try { return String(it) } catch (_e) { return '[Unserializable]' }
}

export class PluginLogger extends EventEmitter<'change' | 'append' | 'clear'> {
  private _logs: PluginLogEntry[] = []
  private _maxSize: number
  private _level: PluginLogLevel

  constructor(
    private _tag?: string,
    private _opts?: PluginLoggerOptions
  ) {
    super()
    this._maxSize = Math.max(50, _opts?.maxSize ?? DEFAULT_LOG_MAX_SIZE)
    this._level = _opts?.level ?? 'DEBUG'
  }

  /**
   * Write a log entry.
   * Backwards compatible: the legacy boolean tail flag in `payload` to force
   * console output is still honored.
   */
  write(level: PluginLogLevel | string, payload: any[], inConsole?: boolean) {
    // back-compat: trailing boolean === true means "force console"
    if (Array.isArray(payload) && payload.length &&
      payload[payload.length - 1] === true) {
      inConsole = true
      payload = payload.slice(0, -1)
    }

    const lvl = (typeof level === 'string'
      ? (level.toUpperCase() as PluginLogLevel)
      : level) as PluginLogLevel
    const normalizedLevel: PluginLogLevel =
      lvl in LOG_LEVEL_WEIGHT ? lvl : 'INFO'

    // level filtering
    if (LOG_LEVEL_WEIGHT[normalizedLevel] < LOG_LEVEL_WEIGHT[this._level]) {
      return
    }

    const message = (payload || []).map(safeStringifyArg).join(' ')
    const entry: PluginLogEntry = {
      ts: Date.now(),
      level: normalizedLevel,
      tag: this._tag || '',
      message,
    }

    this._logs.push(entry)
    // ring buffer
    if (this._logs.length > this._maxSize) {
      this._logs.splice(0, this._logs.length - this._maxSize)
    }

    if (inConsole || this._opts?.console) {
      const fn = normalizedLevel === 'ERROR'
        ? 'error'
        : normalizedLevel === 'WARN'
          ? 'warn'
          : normalizedLevel === 'DEBUG' ? 'debug' : 'info'
      try {
        // eslint-disable-next-line no-console
        console[fn](`[${entry.tag}][${new Date(entry.ts).toLocaleTimeString()}] ${normalizedLevel}: ${message}`)
      } catch (_e) { /* noop */ }
    }

    this.emit('append', entry)
    this.emit('change')
  }

  clear() {
    this._logs = []
    this.emit('clear')
    this.emit('change')
  }

  debug(...args: any[]) { this.write('DEBUG', args) }
  info(...args: any[]) { this.write('INFO', args) }
  warn(...args: any[]) { this.write('WARN', args) }
  error(...args: any[]) { this.write('ERROR', args) }

  setTag(s: string) { this._tag = s }
  getTag() { return this._tag }

  setLevel(l: PluginLogLevel) {
    if (l in LOG_LEVEL_WEIGHT) this._level = l
  }
  getLevel(): PluginLogLevel { return this._level }

  setMaxSize(n: number) {
    this._maxSize = Math.max(50, n | 0)
    if (this._logs.length > this._maxSize) {
      this._logs.splice(0, this._logs.length - this._maxSize)
      this.emit('change')
    }
  }

  /** Structured entries (preferred). */
  getEntries(): PluginLogEntry[] {
    return this._logs.slice()
  }

  /** Legacy tuple format kept for backwards compatibility. */
  toJSON(): Array<[PluginLogLevel, string]> {
    return this._logs.map((e) => [e.level,
      `[${e.tag}][${new Date(e.ts).toLocaleTimeString()}] ${e.message}`])
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
