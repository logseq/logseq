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
export interface InsertBlockOptions {
  before?: boolean
  sibling?: boolean
  start?: boolean
  end?: boolean
  customUUID?: string
}
export type PropertyValue = string | number | boolean
export type CreatedPage = Pick<PageEntity, 'id' | 'uuid' | 'name'>
export interface MoveBlockOptions {
  before?: boolean
  children?: boolean
}
export interface CreatePageOptions {
  customUUID?: string
  redirect?: false
}
export interface UpdateBlockOptions {
  properties?: Record<string, PropertyValue | null>
}

const capabilityNames = [
  'editor_read',
  'editor_command',
  'graph_read',
  'db_query',
  'graph_write',
] as const

export type QuickjsCapability = (typeof capabilityNames)[number]

export type EditorCommandAction =
  | { readonly kind: 'insertText'; readonly text: string }
  | { readonly kind: 'showDatePicker' }
  | { readonly kind: 'exitEditing' }
export type EditorCommandProgram = readonly EditorCommandAction[]
export interface EditorCommandDescriptor {
  readonly key: string
  readonly label: string
}

export interface PortablePluginInfo {
  readonly id: string
  readonly runtime: 'quickjs'
  readonly grantedCapabilities: readonly QuickjsCapability[]
}

export interface PortablePageMetadata {
  readonly id: number
  readonly uuid: string
  readonly name: string
  readonly title: string
  readonly createdAt?: number
  readonly updatedAt?: number
}

export interface QuickjsHost {
  getPluginInfo(): Promise<PortablePluginInfo>
  getEditingState(): Promise<EditingState>
  getCurrentBlock(): Promise<BlockEntity | null>
  getCurrentPage(): Promise<PageResult | null>
  getBlock(identity: Identity): Promise<BlockEntity | null>
  getBlockTree(identity: Identity): Promise<BlockEntity | null>
  getPage(identity: Identity): Promise<PageEntity | null>
  getCurrentPageBlocksTree(): Promise<BlockEntity[]>
  getSelectedBlocks(): Promise<BlockEntity[]>
  getBlockProperty(identity: Identity, key: string): Promise<Data>
  getPageProperties(identity: Identity): Promise<Record<string, Data> | null>
  getTodayPage(): Promise<PageEntity | null>
  getAllPages(): Promise<PortablePageMetadata[]>
  getBlockProperties(identity: Identity): Promise<Record<string, Data> | null>
  insertBlock(
    identity: Identity,
    content: string,
    options: InsertBlockOptions
  ): Promise<BlockEntity | null>
  updateBlock(
    identity: Identity,
    content: string,
    properties: Record<string, PropertyValue | null>
  ): Promise<void>
  getPageBlocksTree(identity: Identity): Promise<BlockEntity[]>
  getBlockChildren(identity: Identity): Promise<BlockEntity[]>
  removeBlock(identity: Identity): Promise<void>
  moveBlock(
    source: Identity,
    target: Identity,
    options: MoveBlockOptions
  ): Promise<void>
  createPage(name: string, options: CreatePageOptions): Promise<CreatedPage>
  renamePage(identity: Identity, name: string): Promise<boolean>
  deletePage(identity: Identity): Promise<void>
  upsertBlockProperty(
    identity: Identity,
    key: string,
    value: PropertyValue
  ): Promise<void>
  removeBlockProperty(identity: Identity, key: string): Promise<void>
  getPageLinkedReferences(
    identity: Identity
  ): Promise<Array<[PageEntity, BlockEntity[]]> | null>
  getSiblingBlock(
    direction: 'previous' | 'next',
    identity: Identity
  ): Promise<BlockEntity | null>
  datascriptQuery(query: string, inputs: Data[]): Promise<Data>
  log(level: LogLevel, text: string): Promise<void>
  registerEditorCommand(
    descriptor: EditorCommandDescriptor,
    handler: (host: QuickjsHost) => Promise<EditorCommandProgram>
  ): Promise<void>
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

function options(value?: { includeChildren?: boolean }): boolean {
  if (value === undefined) return false
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
  return copy.includeChildren === true
}

function propertyIdent(value: string): string {
  if (typeof value !== 'string') failure('Invalid_request')
  data(value)
  const key = value.startsWith(':') ? value.slice(1) : value
  if (!/^[^\u0000-\u0020\u007f:/]+\/[^\u0000-\u0020\u007f:/]+$/u.test(key)) {
    failure('Invalid_request')
  }
  return key
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

function insertionOptions(value: unknown): InsertBlockOptions {
  const copy = data(value === undefined ? {} : value)
  if (!copy || typeof copy !== 'object' || Array.isArray(copy))
    failure('Invalid_request')
  for (const [key, entry] of Object.entries(copy)) {
    if (['properties', 'schema', 'autoOrderedList'].includes(key))
      failure('Unsupported')
    if (key === 'customUUID') {
      if (
        typeof entry !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          entry
        )
      )
        failure('Invalid_request')
    } else if (
      !['before', 'sibling', 'start', 'end'].includes(key) ||
      typeof entry !== 'boolean'
    ) {
      failure('Invalid_request')
    }
  }
  if (
    (copy.start && copy.end) ||
    ((copy.before || copy.sibling) && (copy.start || copy.end))
  )
    failure('Invalid_request')
  return copy as InsertBlockOptions
}

function propertyKey(value: string): string {
  if (
    typeof value !== 'string' ||
    !value.length ||
    !/^[a-zA-Z0-9_-]+$/.test(value)
  )
    failure('Invalid_request')
  if (bytes(value) > 64) failure('Resource_limit')
  return value
}

function content(value: string): string {
  if (typeof value !== 'string') failure('Invalid_request')
  return data(value) as string
}

function emptyOptions(
  value: unknown,
  unsupported: string[],
  flags = false
): void {
  if (value === undefined) return
  const copy = data(value)
  if (!copy || typeof copy !== 'object' || Array.isArray(copy))
    failure('Invalid_request')
  for (const [key, entry] of Object.entries(copy)) {
    if (!unsupported.includes(key)) failure('Invalid_request')
    if (flags && typeof entry !== 'boolean') failure('Invalid_request')
    if (!flags || entry !== false) failure('Unsupported')
  }
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

function datascriptQuery<T = Data>(
  query: string,
  ...inputs: Data[]
): Promise<T> {
  if (typeof query !== 'string' || !query.length) failure('Invalid_request')
  const request = data({ query, inputs }) as { query: string; inputs: Data[] }
  return call((host) =>
    host.datascriptQuery(request.query, request.inputs)
  ) as Promise<T>
}

export const logseq = surface({
  ready,
  get baseInfo(): Readonly<PortablePluginInfo> {
    if (!info) failure('Invalid_request')
    return info
  },
  Editor: surface({
    getCurrentPageBlocksTree() {
      return call((host) => host.getCurrentPageBlocksTree())
    },
    getSelectedBlocks() {
      return call((host) => host.getSelectedBlocks())
    },
    getBlockProperty(value: Identity, key: string) {
      const target = identity(value)
      const name = propertyIdent(key)
      return call((host) => host.getBlockProperty(target, name))
    },
    getPageProperties(value: Identity) {
      const key = identity(value)
      return call((host) => host.getPageProperties(key))
    },
    getTodayPage() {
      return call((host) => host.getTodayPage())
    },
    getAllPages(...args: never[]) {
      if (args.length !== 0) failure('Unsupported')
      return call((host) => host.getAllPages())
    },
    getPageBlocksTree(value: Identity) {
      const key = identity(value)
      return call((host) => host.getPageBlocksTree(key))
    },
    getBlockChildren(value: Identity) {
      const key = identity(value)
      return call((host) => host.getBlockChildren(key))
    },
    removeBlock(value: Identity) {
      const key = identity(value)
      return call((host) => host.removeBlock(key))
    },
    moveBlock(source: Identity, target: Identity, opts: MoveBlockOptions = {}) {
      const from = identity(source),
        to = identity(target),
        flags = data(opts) as MoveBlockOptions
      if (
        !flags ||
        typeof flags !== 'object' ||
        Array.isArray(flags) ||
        Object.entries(flags).some(
          ([key, value]) =>
            !['before', 'children'].includes(key) || typeof value !== 'boolean'
        ) ||
        (flags.before && flags.children)
      )
        failure('Invalid_request')
      return call((host) => host.moveBlock(from, to, flags))
    },
    createPage(
      name: string,
      properties?: Record<string, Data>,
      opts: CreatePageOptions = {}
    ) {
      const title = content(name),
        flags = data(opts) as CreatePageOptions
      if (!title.trim()) failure('Invalid_request')
      if (properties !== undefined) {
        const values = data(properties)
        if (!values || typeof values !== 'object' || Array.isArray(values))
          failure('Invalid_request')
        if (Object.keys(values).length) failure('Unsupported')
      }
      if (!flags || typeof flags !== 'object' || Array.isArray(flags))
        failure('Invalid_request')
      for (const [key, value] of Object.entries(flags)) {
        if (key === 'customUUID') {
          if (typeof value !== 'string') failure('Invalid_request')
          insertionOptions({ customUUID: value })
        } else if (key === 'redirect') {
          if (value !== false) failure('Unsupported')
        } else if (['journal', 'class', 'schema'].includes(key))
          failure('Unsupported')
        else failure('Invalid_request')
      }
      return call((host) => host.createPage(title, flags))
    },
    renamePage(value: Identity, name: string) {
      const key = identity(value),
        title = content(name)
      if (!title.trim()) failure('Invalid_request')
      return call((host) => host.renamePage(key, title))
    },
    deletePage(value: Identity) {
      const key = identity(value)
      return call((host) => host.deletePage(key))
    },
    getPreviousSiblingBlock(value: Identity) {
      const key = identity(value)
      return call((host) => host.getSiblingBlock('previous', key))
    },
    getNextSiblingBlock(value: Identity) {
      const key = identity(value)
      return call((host) => host.getSiblingBlock('next', key))
    },
    async checkEditing(): Promise<string | false> {
      return (await call((host) => host.getEditingState()))?.blockUuid ?? false
    },
    async getEditingBlockContent(): Promise<string | null> {
      return (await call((host) => host.getEditingState()))?.text ?? null
    },
    getCurrentBlock: () => call((host) => host.getCurrentBlock()),
    getCurrentPage: () => call((host) => host.getCurrentPage()),
    getBlock(value: Identity, opts?: { includeChildren?: boolean }) {
      const children = options(opts)
      const key = identity(value)
      return call((host) =>
        children ? host.getBlockTree(key) : host.getBlock(key)
      )
    },
    getPage(value: Identity, opts?: { includeChildren?: boolean }) {
      if (options(opts)) failure('Unsupported')
      const key = identity(value)
      return call((host) => host.getPage(key))
    },
    getBlockProperties(value: Identity) {
      const key = identity(value)
      return call((host) => host.getBlockProperties(key))
    },
    insertBlock(value: Identity, text: string, opts?: InsertBlockOptions) {
      const key = identity(value),
        body = content(text),
        flags = insertionOptions(opts)
      return call((host) => host.insertBlock(key, body, flags))
    },
    updateBlock(value: Identity, text: string, opts: UpdateBlockOptions = {}) {
      const key = identity(value),
        body = content(text)
      const copy = data(opts)
      if (!copy || typeof copy !== 'object' || Array.isArray(copy))
        failure('Invalid_request')
      for (const name of Object.keys(copy)) {
        if (name === 'schema') failure('Unsupported')
        if (name !== 'properties') failure('Invalid_request')
      }
      const patch = 'properties' in copy ? copy.properties : {}
      if (!patch || typeof patch !== 'object' || Array.isArray(patch))
        failure('Invalid_request')
      if (Object.keys(patch).length > 32) failure('Resource_limit')
      for (const [name, value] of Object.entries(patch)) {
        propertyKey(name)
        if (
          value !== null &&
          !['string', 'number', 'boolean'].includes(typeof value)
        )
          failure('Unsupported')
      }
      return call((host) =>
        host.updateBlock(
          key,
          body,
          patch as Record<string, PropertyValue | null>
        )
      )
    },
    upsertBlockProperty(
      value: Identity,
      key: string,
      property: PropertyValue,
      opts?: { reset?: boolean; entityId?: boolean }
    ) {
      const target = identity(value),
        name = propertyKey(key),
        copy = data(property)
      if (copy === null) failure('Invalid_request')
      if (
        typeof copy !== 'string' &&
        typeof copy !== 'number' &&
        typeof copy !== 'boolean'
      )
        failure('Unsupported')
      emptyOptions(opts, ['reset', 'entityId'], true)
      return call((host) => host.upsertBlockProperty(target, name, copy))
    },
    removeBlockProperty(value: Identity, key: string) {
      const target = identity(value),
        name = propertyKey(key)
      return call((host) => host.removeBlockProperty(target, name))
    },
    getPageLinkedReferences(value: Identity) {
      const key = identity(value)
      return call((host) => host.getPageLinkedReferences(key))
    },
  }),
  DB: surface({
    q: datascriptQuery,
    datascriptQuery,
  }),
  Commands: surface({
    registerEditorCommand(
      descriptor: EditorCommandDescriptor,
      handler: () => EditorCommandProgram | Promise<EditorCommandProgram>
    ): Promise<void> {
      if (!activating) return Promise.reject(new PluginError('Unsupported'))
      if (typeof handler !== 'function') failure('Invalid_request')
      const copy = data(descriptor)
      if (
        !copy ||
        typeof copy !== 'object' ||
        Array.isArray(copy) ||
        Object.keys(copy).length !== 2 ||
        typeof copy.key !== 'string' ||
        typeof copy.label !== 'string' ||
        !/^[a-zA-Z0-9_.-]+$/.test(copy.key) ||
        !copy.label.length ||
        Array.from(copy.label).some((char) => {
          const code = char.codePointAt(0)!
          return code < 32 || (code >= 127 && code <= 159)
        })
      )
        failure('Invalid_request')
      if (bytes(copy.key) > 64 || bytes(copy.label) > 128)
        failure('Resource_limit')
      const command = { key: copy.key, label: copy.label }
      return call((host) =>
        host.registerEditorCommand(command, (current) =>
          withHost(current, async () => {
            const result = await handler()
            data(result)
            return result
          })
        )
      )
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

async function withHost<T>(
  host: QuickjsHost,
  action: () => Promise<T>
): Promise<T> {
  if (activeHost) failure('Invalid_request')
  activeHost = host
  try {
    const result = await action()
    while (pending.size) await Promise.all([...pending])
    return result
  } finally {
    try {
      while (diagnostics.length) {
        const entry = diagnostics.shift()!
        await call((current) => current.log(entry.level, entry.text))
      }
      diagnosticBytes = 0
    } finally {
      activeHost = null
    }
  }
}

export async function activate(host: QuickjsHost): Promise<[]> {
  if (activating) failure('Invalid_request')
  if (initialized) return []
  activating = true
  try {
    return await withHost(host, async () => {
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
    })
  } catch (error) {
    for (const registration of registrations.splice(0))
      registration.reject(error)
    throw error
  } finally {
    activating = false
  }
}
