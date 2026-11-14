import type { BlockEntity, PageEntity } from './LSPlugin.entities'
export type {
  EntityID,
  BlockUUID,
  BlockUUIDTuple,
  IEntityID,
  BlockEntity,
  PageEntity,
} from './LSPlugin.entities'

type ErrorCode =
  | 'Invalid_request'
  | 'Unsupported'
  | 'Permission_denied'
  | 'Stale_context'
  | 'Cancelled'
  | 'Resource_limit'
  | 'Runtime_failure'

type Data = null | boolean | number | string | Data[] | { [key: string]: Data }
type Identity = string | number | { uuid: string }
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type EditingState = { blockUuid: string; text: string } | null
type PageResult = PageEntity | { name: string; title: string; uuid?: string }

const capabilityNames = [
  'editor_read',
  'editor_command',
  'graph_read',
  'db_query',
] as const

export type QuickjsCapability = (typeof capabilityNames)[number]

export interface PortablePluginInfo {
  readonly id: string
  readonly runtime: 'quickjs'
  readonly grantedCapabilities: readonly QuickjsCapability[]
}

export interface QuickjsHost {
  getPluginInfo(): Promise<PortablePluginInfo>
  getEditingState(): Promise<EditingState>
  getCurrentBlock(): Promise<BlockEntity | null>
  getCurrentPage(): Promise<PageResult | null>
  getBlock(identity: Identity): Promise<BlockEntity | null>
  getPage(identity: Identity): Promise<PageEntity | null>
  datascriptQuery(query: string, inputs: Data[]): Promise<Data>
  log(level: LogLevel, text: string): Promise<void>
}

export class PluginError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code)
    this.name = 'PluginError'
  }
}

const errorCodes = new Set<ErrorCode>([
  'Invalid_request',
  'Unsupported',
  'Permission_denied',
  'Stale_context',
  'Cancelled',
  'Resource_limit',
  'Runtime_failure',
])

function failure(code: ErrorCode): never {
  throw new PluginError(code)
}

function bytes(text: string): number {
  let total = 0
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (code >= 0xd800 && code <= 0xdfff) failure('Invalid_request')
    total += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4
  }
  return total
}

function data(value: unknown): Data {
  let nodes = 0
  let size = 0
  const ancestors = new Set<object>()
  function string(text: string): string {
    const count = bytes(text)
    size += count
    if (count > 32768 || size > 65536) failure('Resource_limit')
    return text
  }
  function visit(item: unknown, depth: number): Data {
    if (++nodes > 4096 || depth > 16 || (size += 16) > 65536) {
      failure('Resource_limit')
    }
    if (item === null) return null
    if (typeof item === 'boolean') return item
    if (typeof item === 'string') return string(item)
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) failure('Invalid_request')
      return item
    }
    if (typeof item !== 'object' || ancestors.has(item))
      failure('Invalid_request')
    const array = Array.isArray(item)
    const prototype = Object.getPrototypeOf(item)
    if (
      array
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    ) {
      failure('Invalid_request')
    }
    ancestors.add(item)
    try {
      const descriptors = Object.getOwnPropertyDescriptors(item)
      if (Reflect.ownKeys(descriptors).some((key) => typeof key !== 'string')) {
        failure('Invalid_request')
      }
      if (array) {
        if (item.length > 4096) failure('Resource_limit')
        if (Object.keys(descriptors).length !== item.length + 1)
          failure('Invalid_request')
        return Array.from({ length: item.length }, (_, index) => {
          const descriptor = descriptors[String(index)]
          if (!descriptor || !('value' in descriptor))
            failure('Invalid_request')
          return visit(descriptor.value, depth + 1)
        })
      }
      const result: { [key: string]: Data } = Object.create(null)
      for (const key of Object.keys(descriptors)) {
        const descriptor = descriptors[key]
        if (!('value' in descriptor)) failure('Invalid_request')
        result[string(key)] = visit(descriptor.value, depth + 1)
      }
      return result
    } finally {
      ancestors.delete(item)
    }
  }
  return visit(value, 0)
}

function identity(value: Identity): Identity {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0 || value > 2147483647)
      failure('Invalid_request')
    return value
  }
  if (typeof value === 'string') {
    data(value)
    if (!value.length) failure('Invalid_request')
    return value
  }
  const copy = data(value)
  if (
    !copy ||
    typeof copy !== 'object' ||
    Array.isArray(copy) ||
    Object.keys(copy).length !== 1 ||
    typeof copy.uuid !== 'string'
  ) {
    failure('Invalid_request')
  }
  return { uuid: copy.uuid }
}

function options(value?: { includeChildren?: boolean }): void {
  if (value === undefined) return
  const copy = data(value)
  if (
    !copy ||
    typeof copy !== 'object' ||
    Array.isArray(copy) ||
    Object.keys(copy).some((key) => key !== 'includeChildren') ||
    ('includeChildren' in copy && typeof copy.includeChildren !== 'boolean')
  ) {
    failure('Invalid_request')
  }
  if (copy.includeChildren === true) failure('Unsupported')
}

function surface<T extends object>(value: T): Readonly<T> {
  return new Proxy(Object.freeze(value), {
    get(target, key, receiver) {
      if (key === 'then') return undefined
      if (
        typeof key === 'string' &&
        !Object.prototype.hasOwnProperty.call(target, key)
      ) {
        failure('Unsupported')
      }
      return Reflect.get(target, key, receiver)
    },
  })
}

function pluginInfo(value: PortablePluginInfo): Readonly<PortablePluginInfo> {
  const grants = value.grantedCapabilities
  if (!Array.isArray(grants)) failure('Unsupported')
  if (
    typeof value.id !== 'string' ||
    value.runtime !== 'quickjs' ||
    grants.length > capabilityNames.length ||
    grants.some((capability) => !capabilityNames.includes(capability)) ||
    new Set(grants).size !== grants.length
  ) {
    failure('Invalid_request')
  }
  return surface({
    id: value.id,
    runtime: value.runtime,
    grantedCapabilities: Object.freeze([...grants]),
  })
}

let activeHost: QuickjsHost | null = null
let info: PortablePluginInfo | null = null
let initialized = false
let activating = false
const pending = new Set<Promise<unknown>>()
const registrations: {
  callback?: (info: PortablePluginInfo) => unknown
  resolve(): void
  reject(error: unknown): void
}[] = []
const diagnostics: { level: LogLevel; text: string }[] = []
let diagnosticBytes = 0

function track<T>(task: Promise<T>): Promise<T> {
  pending.add(task)
  // Avoid recursively tracking the readiness observer itself.
  void Promise.prototype.then.call(
    task,
    () => pending.delete(task),
    () => pending.delete(task)
  )
  return task
}

class ReadyPromise<T> extends Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    fulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return track(super.then(fulfilled, rejected))
  }
}

function call<T>(action: (host: QuickjsHost) => Promise<T>): Promise<T> {
  if (!activeHost) return Promise.reject(new PluginError('Invalid_request'))
  const task = action(activeHost).catch((error: unknown) => {
    if (typeof error === 'string' && errorCodes.has(error as ErrorCode)) {
      throw new PluginError(error as ErrorCode)
    }
    throw error
  })
  return track(task)
}

function ready(
  callback?: (info: PortablePluginInfo) => unknown
): Promise<void> {
  if (callback !== undefined && typeof callback !== 'function') {
    return Promise.reject(new PluginError('Unsupported'))
  }
  if (initialized) {
    return callback === undefined
      ? Promise.resolve()
      : Promise.reject(new PluginError('Unsupported'))
  }
  return new ReadyPromise((resolve, reject) =>
    registrations.push({ callback, resolve, reject })
  )
}

function diagnostic(level: LogLevel, values: unknown[]): void {
  const text = values
    .map((value) => {
      if (value instanceof Error) {
        const message = Object.getOwnPropertyDescriptor(value, 'message')
        if (!message) return 'Error'
        if (!('value' in message) || typeof message.value !== 'string')
          failure('Invalid_request')
        return message.value
      }
      return typeof value === 'string' ? value : JSON.stringify(data(value))
    })
    .join(' ')
  diagnosticBytes += bytes(text)
  if (diagnosticBytes > 8192 || diagnostics.length >= 32)
    failure('Resource_limit')
  diagnostics.push({ level, text })
}

export const logseq = surface({
  ready,
  get baseInfo(): Readonly<PortablePluginInfo> {
    if (!info) failure('Invalid_request')
    return info
  },
  Editor: surface({
    async checkEditing(): Promise<string | false> {
      return (await call((host) => host.getEditingState()))?.blockUuid ?? false
    },
    async getEditingBlockContent(): Promise<string | null> {
      return (await call((host) => host.getEditingState()))?.text ?? null
    },
    getCurrentBlock: () => call((host) => host.getCurrentBlock()),
    getCurrentPage: () => call((host) => host.getCurrentPage()),
    getBlock(value: Identity, opts?: { includeChildren?: boolean }) {
      options(opts)
      const key = identity(value)
      return call((host) => host.getBlock(key))
    },
    getPage(value: Identity, opts?: { includeChildren?: boolean }) {
      options(opts)
      const key = identity(value)
      return call((host) => host.getPage(key))
    },
  }),
  DB: surface({
    datascriptQuery<T = Data>(query: string, ...inputs: Data[]): Promise<T> {
      if (typeof query !== 'string' || !query.length) failure('Invalid_request')
      const request = data({ query, inputs }) as {
        query: string
        inputs: Data[]
      }
      return call((host) =>
        host.datascriptQuery(request.query, request.inputs)
      ) as Promise<T>
    },
  }),
})

Object.defineProperty(globalThis, 'logseq', { value: logseq })
Object.defineProperty(globalThis, 'console', {
  value: surface({
    log: (...values: unknown[]) => diagnostic('info', values),
    info: (...values: unknown[]) => diagnostic('info', values),
    warn: (...values: unknown[]) => diagnostic('warn', values),
    error: (...values: unknown[]) => diagnostic('error', values),
    debug: (...values: unknown[]) => diagnostic('debug', values),
  }),
})

export async function activate(host: QuickjsHost): Promise<[]> {
  if (activating) failure('Invalid_request')
  if (initialized) return []
  activating = true
  activeHost = host
  try {
    info = pluginInfo(await call((current) => current.getPluginInfo()))
    initialized = true
    const initializers: Promise<unknown>[] = []
    for (const registration of registrations.splice(0)) {
      initializers.push(
        Promise.resolve()
          .then(() => {
            const completion = registration.callback?.(info!)
            registration.resolve()
            return completion
          })
          .then(
            () => registration.resolve(),
            (error: unknown) => {
              registration.reject(error)
              throw error
            }
          )
      )
    }
    await Promise.all(initializers)
    while (pending.size) await Promise.all([...pending])
    return []
  } catch (error) {
    for (const registration of registrations.splice(0))
      registration.reject(error)
    throw error
  } finally {
    try {
      while (diagnostics.length) {
        const entry = diagnostics.shift()!
        await call((current) => current.log(entry.level, entry.text))
      }
      diagnosticBytes = 0
    } finally {
      activeHost = null
      activating = false
    }
  }
}
