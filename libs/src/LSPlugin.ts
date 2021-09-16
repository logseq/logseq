import EventEmitter from 'eventemitter3'
import * as CSS from 'csstype'
import { LSPluginCaller } from './LSPlugin.caller'
import { LSPluginFileStorage } from './modules/LSPlugin.Storage'

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

export type UIFrameAttrs = {
  draggable: boolean
  resizable: boolean

  [key: string]: any
}

export type UIBaseOptions = {
  key?: string
  replace?: boolean
  template: string
}

export type UIPathIdentity = {
  /**
   * DOM selector
   */
  path: string
}

export type UISlotIdentity = {
  /**
   * Slot key
   */
  slot: string
}

export type UISlotOptions = UIBaseOptions & UISlotIdentity

export type UIPathOptions = UIBaseOptions & UIPathIdentity

export type UIOptions = UIPathOptions | UISlotOptions

export interface LSPluginPkgConfig {
  id: PluginLocalIdentity
  title: string
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

export type EntityID = number
export type BlockUUID = string
export type BlockUUIDTuple = ['uuid', BlockUUID]

export type IEntityID = { id: EntityID }
export type IBatchBlock = { content: string, properties?: Record<string, any>, children?: Array<IBatchBlock> }

export interface AppUserInfo {
  [key: string]: any
}

/**
 * User's app configurations
 */
export interface AppUserConfigs {
  preferredThemeMode: 'dark' | 'light'
  preferredFormat: 'markdown' | 'org'
  preferredDateFormat: string
  preferredLanguage: string
  preferredWorkflow: string

  [key: string]: any
}

/**
 * In Logseq, a graph represents a repository of connected pages and blocks
 */
export interface AppGraphInfo {
  name: string
  url: string
  path: string

  [key: string]: any
}

/**
 * Block - Logseq's fundamental data structure.
 */
export interface BlockEntity {
  id: EntityID // db id
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

/**
 * Page is just a block with some specific properties.
 */
export interface PageEntity {
  id: EntityID
  uuid: BlockUUID
  name: string
  originalName: string
  'journal?': boolean

  file?: IEntityID
  namespace?: IEntityID
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

/**
 * App level APIs
 */
export interface IAppProxy {
  getUserInfo: () => Promise<AppUserInfo | null>

  getUserConfigs: () => Promise<AppUserConfigs>

  // native
  relaunch: () => Promise<void>
  quit: () => Promise<void>
  openExternalLink: (url: string) => Promise<void>

  // graph
  getCurrentGraph: () => Promise<AppGraphInfo | null>

  // router
  pushState: (k: string, params?: Record<string, any>, query?: Record<string, any>) => void
  replaceState: (k: string, params?: Record<string, any>, query?: Record<string, any>) => void

  // ui
  showMsg: (content: string, status?: 'success' | 'warning' | string) => void
  setZoomFactor: (factor: number) => void

  registerUIItem: (
    type: 'toolbar' | 'pagebar',
    opts: { key: string, template: string }
  ) => void

  registerPageMenuItem: (
    tag: string,
    action: (e: IHookEvent & { page: string }) => void
  ) => void

  // hook events
  onCurrentGraphChanged: IUserHook
  onThemeModeChanged: IUserHook<{ mode: 'dark' | 'light' }>
  onBlockRendererSlotted: IUserSlotHook<{ uuid: BlockUUID }>
  onMacroRendererSlotted: IUserSlotHook<{ payload: { arguments: Array<string>, uuid: string, [key: string]: any } }>
  onPageHeadActionsSlotted: IUserSlotHook
  onRouteChanged: IUserHook<{ path: string, template: string }>
  onSidebarVisibleChanged: IUserHook<{ visible: boolean }>
}

/**
 * Editor related APIs
 */
export interface IEditorProxy extends Record<string, any> {
  /**
   * register a custom command which will be added to the Logseq slash command list
   *
   * @param tag - displayed name of command
   * @param action - can be a single callback function to run when the command is called, or an array of fixed commands with arguments
   *
   * @example
   * ```ts
   * logseq.Editor.registerSlashCommand("Say Hi", () => {
   *   console.log('Hi!')
   * })
   * ```
   *
   * @example
   * ```ts
   * logseq.Editor.registerSlashCommand("💥 Big Bang", [
   *   ["editor/hook", "customCallback"],
   *   ["editor/clear-current-slash"],
   * ]);
   * ```
   */
  registerSlashCommand: (
    tag: string,
    action: BlockCommandCallback | Array<SlashCommandAction>
  ) => unknown

  /**
   * register a custom command in the block context menu (triggered by right clicking the block dot)
   * @param tag - displayed name of command
   * @param action - can be a single callback function to run when the command is called
   */
  registerBlockContextMenuItem: (
    tag: string,
    action: BlockCommandCallback
  ) => unknown

  // block related APIs

  checkEditing: () => Promise<BlockUUID | boolean>

  /**
   * insert a string at the current cursor
   */
  insertAtEditingCursor: (content: string) => Promise<void>

  restoreEditingCursor: () => Promise<void>

  exitEditingMode: (selectBlock?: boolean) => Promise<void>

  getEditingCursorPosition: () => Promise<BlockCursorPosition | null>

  getEditingBlockContent: () => Promise<string>

  getCurrentPage: () => Promise<PageEntity | BlockEntity | null>

  getCurrentBlock: () => Promise<BlockEntity | null>

  /**
   * get all blocks of the current page as a tree structure
   *
   * @example
   * ```ts
   * const blocks = await logseq.Editor.getCurrentPageBlocksTree()
   * initMindMap(blocks)
   * ```
   */
  getCurrentPageBlocksTree: () => Promise<Array<BlockEntity>>

  /**
   * get all blocks for the specified page
   *
   * @param srcPage - the page name or uuid
   */
  getPageBlocksTree: (srcPage: PageIdentity) => Promise<Array<BlockEntity>>

  insertBlock: (
    srcBlock: BlockIdentity,
    content: string,
    opts?: Partial<{ before: boolean; sibling: boolean; properties: {} }>
  ) => Promise<BlockEntity | null>

  insertBatchBlock: (
    srcBlock: BlockIdentity,
    batch: IBatchBlock | Array<IBatchBlock>,
    opts?: Partial<{ before: boolean, sibling: boolean }>
  ) => Promise<Array<BlockEntity> | null>

  updateBlock: (
    srcBlock: BlockIdentity,
    content: string,
    opts?: Partial<{ properties: {} }>
  ) => Promise<void>

  removeBlock: (
    srcBlock: BlockIdentity
  ) => Promise<void>

  getBlock: (
    srcBlock: BlockIdentity | EntityID,
    opts?: Partial<{ includeChildren: boolean }>
  ) => Promise<BlockEntity | null>

  getPage: (
    srcPage: PageIdentity | EntityID,
    opts?: Partial<{ includeChildren: boolean }>
  ) => Promise<PageEntity | null>

  createPage: (
    pageName: BlockPageName,
    properties?: {},
    opts?: Partial<{ redirect: boolean, createFirstBlock: boolean, format: BlockEntity['format'] }>
  ) => Promise<PageEntity | null>

  deletePage: (
    pageName: BlockPageName
  ) => Promise<void>

  renamePage: (oldName: string, newName: string) => Promise<void>

  getAllPages: (repo?: string) => Promise<any>

  getPreviousSiblingBlock: (
    srcBlock: BlockIdentity
  ) => Promise<BlockEntity | null>

  getNextSiblingBlock: (srcBlock: BlockIdentity) => Promise<BlockEntity | null>

  moveBlock: (
    srcBlock: BlockIdentity,
    targetBlock: BlockIdentity,
    opts?: Partial<{ before: boolean; children: boolean }>
  ) => Promise<void>

  editBlock: (srcBlock: BlockIdentity, opts?: { pos: number }) => Promise<void>

  upsertBlockProperty: (
    block: BlockIdentity,
    key: string,
    value: any
  ) => Promise<void>

  removeBlockProperty: (block: BlockIdentity, key: string) => Promise<void>

  getBlockProperty: (block: BlockIdentity, key: string) => Promise<any>

  getBlockProperties: (block: BlockIdentity) => Promise<any>

  scrollToBlockInPage: (
    pageName: BlockPageName,
    blockId: BlockIdentity
  ) => void
}

/**
 * Datascript related APIs
 */
export interface IDBProxy {
  /**
   * Run a DSL query
   * @link https://logseq.github.io/#/page/queries
   * @param dsl
   */
  q: <T = any>(dsl: string) => Promise<Array<T> | null>

  /**
   * Run a datascript query
   */
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
   * Connection status with the main app
   */
  connected: boolean

  /**
   * Duplex message caller
   */
  caller: LSPluginCaller

  /**
   * The plugin configurations from package.json
   */
  baseInfo: LSPluginBaseInfo

  /**
   * The plugin user settings
   */
  settings?: LSPluginBaseInfo['settings']

  /**
   * The main Logseq app is ready to run the plugin
   *
   * @param model - same as the model in `provideModel`
   */
  ready (model?: Record<string, any>): Promise<any>

  /**
   * @param callback - a function to run when the main Logseq app is ready
   */
  ready (callback?: (e: any) => void | {}): Promise<any>

  ready (
    model?: Record<string, any>,
    callback?: (e: any) => void | {}
  ): Promise<any>

  beforeunload: (callback: () => Promise<void>) => void

  /**
   * Create a object to hold the methods referenced in `provideUI`
   *
   * @example
   * ```ts
   * logseq.provideModel({
   *  openCalendar () {
   *    console.log('Open the calendar!')
   *  }
   * })
   * ```
   */
  provideModel (model: Record<string, any>): this

  /**
   * Set the theme for the main Logseq app
   */
  provideTheme (theme: ThemeOptions): this

  /**
   * Inject custom css for the main Logseq app
   *
   * @example
   * ```ts
   *   logseq.provideStyle(`
   *    @import url("https://at.alicdn.com/t/font_2409735_r7em724douf.css");
   *  )
   * ```
   *
   * @example
   * ```ts
   *
   * ```
   */
  provideStyle (style: StyleString | StyleOptions): this

  /**
   * Inject custom UI at specific DOM node.
   * Event handlers can not be passed by string, so you need to create them in `provideModel`
   *
   * @example
   * ```ts
   * logseq.provideUI({
   * key: 'open-calendar',
   * path: '#search',
   * template: `
   *  <a data-on-click="openCalendar" onclick="alert('abc')' style="opacity: .6; display: inline-flex; padding-left: 3px;'>
   *    <i class="iconfont icon-Calendaralt2"></i>
   *  </a>
   * `
   * })
   * ```
   */
  provideUI (ui: UIOptions): this

  updateSettings (attrs: Record<string, any>): void

  setMainUIAttrs (attrs: Record<string, any>): void

  /**
   * Set the style for the plugin's UI
   *
   * @example
   * ```ts
   * logseq.setMainUIInlineStyle({
   *  position: 'fixed',
   *  zIndex: 11,
   * })
   * ```
   */
  setMainUIInlineStyle (style: CSS.Properties): void

  /**
   * show the plugin's UI
   */
  showMainUI (): void

  /**
   * hide the plugin's UI
   */
  hideMainUI (opts?: { restoreEditingCursor: boolean }): void

  /**
   * toggle the plugin's UI
   */
  toggleMainUI (): void

  isMainUIVisible: boolean

  resolveResourceFullUrl (filePath: string): string

  App: IAppProxy & Record<string, any>
  Editor: IEditorProxy & Record<string, any>
  DB: IDBProxy

  FileStorage: LSPluginFileStorage
}
