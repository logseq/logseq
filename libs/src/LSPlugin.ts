import EventEmitter from 'eventemitter3'
import * as CSS from 'csstype'
import { LSPluginCaller } from './LSPlugin.caller'

export type PluginLocalIdentity = string

export type ThemeOptions = {
  name: string
  url: string
  description?: string
  mode?: 'dark' | 'light'

  [key: string]: any
}

export type StyleString = string;
export type StyleOptions = {
  key?: string
  style: StyleString
}

export type UIBaseOptions = {
  key?: string
  replace?: boolean
  template: string
}

export type UIPathIdentity = {
  path: string // dom selector
}

export type UISlotIdentity = {
  slot: string // slot key
}

export type UISlotOptions = UIBaseOptions & UISlotIdentity
export type UIPathOptions = UIBaseOptions & UIPathIdentity
export type UIOptions = UIPathOptions | UISlotOptions

export interface LSPluginPkgConfig {
  id: PluginLocalIdentity
  mode: 'shadow' | 'iframe'
  themes: Array<ThemeOptions>
  icon: string
}

export interface LSPluginBaseInfo {
  id: string // should be unique
  mode: 'shadow' | 'iframe'

  settings: {
    disabled: boolean
    [key: string]: any
  },

  [key: string]: any
}

export type IHookEvent = {
  [key: string]: any
}

export type IUserOffHook = () => void
export type IUserHook<E = any, R = IUserOffHook> = (callback: (e: IHookEvent & E) => void) => IUserOffHook
export type IUserSlotHook<E = any> = (callback: (e: IHookEvent & UISlotIdentity & E) => void) => void

export type BlockID = number
export type BlockUUID = string
export type BlockUUIDTuple = ['uuid', BlockUUID]

export type IBatchBlock = { content: string, props?: Record<string, any>, children?: Array<IBatchBlock> }
export type IEntityID = { id: BlockID }

export interface AppUserConfigs {
  preferredThemeMode: 'dark' | 'light'
  preferredFormat: 'markdown' | 'org'
  preferredLanguage: string
  preferredWorkflow: string

  [key: string]: any
}

export interface BlockEntity {
  id: BlockID // db id
  uuid: BlockUUID
  left: IEntityID
  format: 'markdown' | 'org'
  parent: IEntityID
  unordered: boolean
  content: string
  page: IEntityID

  // optional fields in dummy page
  anchor?: string
  body?: any
  children?: Array<BlockEntity | BlockUUIDTuple>
  container?: string
  file?: IEntityID
  level?: number
  meta?: { timestamps: any, properties: any, startPos: number, endPos: number }
  title?: Array<any>

  [key: string]: any
}

export interface PageEntity {
  id: BlockID
  uuid: BlockUUID
  name: string
  originalName: string
  'journal?': boolean

  file?: IEntityID
  format?: 'markdown' | 'org'
  journalDay?: number
}

export type BlockIdentity = BlockUUID | Pick<BlockEntity, 'uuid'>
export type BlockPageName = string
export type PageIdentity = BlockPageName | BlockIdentity
export type SlashCommandActionCmd =
  'editor/input'
  | 'editor/hook'
  | 'editor/clear-current-slash'
  | 'editor/restore-saved-cursor'
export type SlashCommandAction = [cmd: SlashCommandActionCmd, ...args: any]
export type BlockCommandCallback = (e: IHookEvent & { uuid: BlockUUID }) => Promise<void>
export type BlockCursorPosition = { left: number, top: number, height: number, pos: number, rect: DOMRect }

export interface IAppProxy {
  getUserInfo: () => Promise<any>
  getUserConfigs: () => Promise<AppUserConfigs>

  // native
  relaunch: () => Promise<void>
  quit: () => Promise<void>

  // router
  pushState: (k: string, params?: {}) => void
  replaceState: (k: string, params?: {}) => void

  // ui
  showMsg: (content: string, status?: 'success' | 'warning' | string) => void
  setZoomFactor: (factor: number) => void

  // events
  onThemeModeChanged: IUserHook<{ mode: 'dark' | 'light' }>
  onBlockRendererMounted: IUserSlotHook<{ uuid: BlockUUID }>
  onRouteChanged: IUserHook<{ path: string, template: string }>
  onSidebarVisibleChanged: IUserHook<{ visible: boolean }>
}

export interface IEditorProxy extends Record<string, any> {
  /**
   * Register logseq `slash` command when editing mode
   * @param tag command name
   * @param action command callback
   */
  registerSlashCommand: (tag: string, action: BlockCommandCallback | Array<SlashCommandAction>) => boolean

  /**
   * @param tag
   * @param action
   */
  registerBlockContextMenu: (tag: string, action: BlockCommandCallback) => boolean

  // block related APIs
  checkEditing: () => Promise<BlockUUID | boolean>
  insertAtEditingCursor: (content: string) => Promise<void>
  restoreEditingCursor: () => Promise<void>
  exitEditingMode: (selectBlock?: boolean) => Promise<void>
  getEditingCursorPosition: () => Promise<BlockCursorPosition | null>
  getEditingBlockContent: () => Promise<string>
  getCurrentPage: () => Promise<PageEntity | BlockEntity | null>
  getCurrentBlock: () => Promise<BlockEntity | null>
  getCurrentPageBlocksTree: () => Promise<Array<BlockEntity>>
  getPageBlocksTree: (srcPage: PageIdentity) => Promise<Array<BlockEntity>>

  insertBlock: (srcBlock: BlockIdentity, content: string, opts?: Partial<{ before: boolean, sibling: boolean, props: {} }>) => Promise<BlockEntity | null>
  insertBatchBlock: (srcBlock: BlockIdentity, batch: IBatchBlock | Array<IBatchBlock>, opts?: Partial<{ before: boolean, sibling: boolean }>) => Promise<null>
  updateBlock: (srcBlock: BlockIdentity, content: string, opts?: Partial<{ props: {} }>) => Promise<void>
  removeBlock: (srcBlock: BlockIdentity, opts?: Partial<{ includeChildren: boolean }>) => Promise<void>
  getBlock: (srcBlock: BlockIdentity | BlockID, opts?: Partial<{ includeChildren: boolean }>) => Promise<BlockEntity | null>
  getPage: (srcPage: PageIdentity | BlockID, opts?: Partial<{ includeChildren: boolean }>) => Promise<PageEntity | null>

  getPreviousSiblingBlock: (srcBlock: BlockIdentity) => Promise<BlockEntity | null>
  getNextSiblingBlock: (srcBlock: BlockIdentity) => Promise<BlockEntity | null>
  moveBlock: (srcBlock: BlockIdentity, targetBlock: BlockIdentity, opts?: Partial<{ before: boolean, children: boolean }>) => Promise<void>
  editBlock: (srcBlock: BlockIdentity, opts?: { pos: number }) => Promise<void>

  upsertBlockProperty: (block: BlockIdentity, key: string, value: any) => Promise<void>
  removeBlockProperty: (block: BlockIdentity, key: string) => Promise<void>
  getBlockProperty: (block: BlockIdentity, key: string) => Promise<any>
  getBlockProperties: (block: BlockIdentity) => Promise<any>
}

export interface IDBProxy {
  datascriptQuery: <T = any>(query: string) => Promise<T>
}

export interface ILSPluginThemeManager extends EventEmitter {
  themes: Map<PluginLocalIdentity, Array<ThemeOptions>>

  registerTheme (id: PluginLocalIdentity, opt: ThemeOptions): Promise<void>

  unregisterTheme (id: PluginLocalIdentity): Promise<void>

  selectTheme (opt?: ThemeOptions): Promise<void>
}

export type LSPluginUserEvents = 'ui:visible:changed' | 'settings:changed'

export interface ILSPluginUser extends EventEmitter<LSPluginUserEvents> {
  /**
   * Indicate connected with host
   */
  connected: boolean

  /**
   * Duplex message caller
   */
  caller: LSPluginCaller

  /**
   * Most from packages
   */
  baseInfo: LSPluginBaseInfo

  /**
   * Plugin user settings
   */
  settings?: LSPluginBaseInfo['settings']

  /**
   * Ready for host connected
   */
  ready (model?: Record<string, any>): Promise<any>

  ready (callback?: (e: any) => void | {}): Promise<any>

  ready (model?: Record<string, any>, callback?: (e: any) => void | {}): Promise<any>

  /**
   * @param callback
   */
  beforeunload: (callback: () => Promise<void>) => void

  /**
   * @param model
   */
  provideModel (model: Record<string, any>): this

  /**
   * @param theme options
   */
  provideTheme (theme: ThemeOptions): this

  /**
   * @param style
   */
  provideStyle (style: StyleString | StyleOptions): this

  /**
   * @param ui options
   */
  provideUI (ui: UIOptions): this

  /**
   * @param attrs
   */
  updateSettings (attrs: Record<string, any>): void

  /**
   * MainUI for index.html
   * @param attrs
   */
  setMainUIAttrs (attrs: Record<string, any>): void

  setMainUIInlineStyle (style: CSS.Properties): void

  showMainUI (): void

  hideMainUI (opts?: { restoreEditingCursor: boolean }): void

  toggleMainUI (): void

  isMainUIVisible: boolean

  App: IAppProxy & Record<string, any>
  Editor: IEditorProxy & Record<string, any>
  DB: IDBProxy
}
