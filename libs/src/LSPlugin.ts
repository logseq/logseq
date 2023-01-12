import * as CSS from 'csstype'

import EventEmitter from 'eventemitter3'
import { LSPluginCaller } from './LSPlugin.caller'
import { LSPluginExperiments } from './modules/LSPlugin.Experiments'
import { IAsyncStorage, LSPluginFileStorage } from './modules/LSPlugin.Storage'
import { LSPluginRequest } from './modules/LSPlugin.Request'

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PluginLocalIdentity = string

export type ThemeMode = 'light' | 'dark'

export interface LegacyTheme {
  name: string
  url: string
  description?: string
  mode?: ThemeMode
  pid: PluginLocalIdentity
}

export interface Theme extends LegacyTheme {
  mode: ThemeMode
}

export type StyleString = string
export type StyleOptions = {
  key?: string
  style: StyleString
}

export type UIContainerAttrs = {
  draggable: boolean
  resizable: boolean

  [key: string]: any
}

export type UIBaseOptions = {
  key?: string
  replace?: boolean
  template: string | null
  style?: CSS.Properties
  attrs?: Record<string, string>
  close?: 'outside' | string
  reset?: boolean // reset slot content or not
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

export type UIOptions = UIBaseOptions | UIPathOptions | UISlotOptions

export interface LSPluginPkgConfig {
  id: PluginLocalIdentity
  main: string
  entry: string // alias of main
  title: string
  mode: 'shadow' | 'iframe'
  themes: Theme[]
  icon: string

  [key: string]: any
}

export interface LSPluginBaseInfo {
  id: string // should be unique
  mode: 'shadow' | 'iframe'

  settings: {
    disabled: boolean
    [key: string]: any
  }

  [key: string]: any
}

export type IHookEvent = {
  [key: string]: any
}

export type IUserOffHook = () => void
export type IUserHook<E = any, R = IUserOffHook> = (
  callback: (e: IHookEvent & E) => void
) => IUserOffHook
export type IUserSlotHook<E = any> = (
  callback: (e: IHookEvent & UISlotIdentity & E) => void
) => void
export type IUserConditionSlotHook<C = any, E = any> = (
  condition: C,
  callback: (e: IHookEvent & UISlotIdentity & E) => void
) => void

export type EntityID = number
export type BlockUUID = string
export type BlockUUIDTuple = ['uuid', BlockUUID]

export type IEntityID = { id: EntityID; [key: string]: any }
export type IBatchBlock = {
  content: string
  properties?: Record<string, any>
  children?: Array<IBatchBlock>
}
export type IDatom = [e: number, a: string, v: any, t: number, added: boolean]

export type IGitResult = { stdout: string; stderr: string; exitCode: number }

export interface AppUserInfo {
  [key: string]: any
}

export interface AppInfo {
  version: string

  [key: string]: any
}

/**
 * User's app configurations
 */
export interface AppUserConfigs {
  preferredThemeMode: ThemeMode
  preferredFormat: 'markdown' | 'org'
  preferredDateFormat: string
  preferredStartOfWeek: string
  preferredLanguage: string
  preferredWorkflow: string

  currentGraph: string
  showBracket: boolean
  enabledFlashcards: boolean
  enabledJournals: boolean

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
  properties?: Record<string, any>

  // optional fields in dummy page
  anchor?: string
  body?: any
  children?: Array<BlockEntity | BlockUUIDTuple>
  container?: string
  file?: IEntityID
  level?: number
  meta?: { timestamps: any; properties: any; startPos: number; endPos: number }
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
  children?: Array<PageEntity>
  properties?: Record<string, any>
  format?: 'markdown' | 'org'
  journalDay?: number
  updatedAt?: number

  [key: string]: any
}

export type BlockIdentity = BlockUUID | Pick<BlockEntity, 'uuid'>
export type BlockPageName = string
export type PageIdentity = BlockPageName | BlockIdentity
export type SlashCommandActionCmd =
  | 'editor/input'
  | 'editor/hook'
  | 'editor/clear-current-slash'
  | 'editor/restore-saved-cursor'
export type SlashCommandAction = [cmd: SlashCommandActionCmd, ...args: any]
export type SimpleCommandCallback<E = any> = (e: IHookEvent & E) => void
export type BlockCommandCallback = (
  e: IHookEvent & { uuid: BlockUUID }
) => Promise<void>
export type BlockCursorPosition = {
  left: number
  top: number
  height: number
  pos: number
  rect: DOMRect
}

export type SimpleCommandKeybinding = {
  mode?: 'global' | 'non-editing' | 'editing'
  binding: string
  mac?: string // special for Mac OS
}

export type SettingSchemaDesc = {
  key: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'heading'
  default: string | number | boolean | Array<any> | object | null
  title: string
  description: string // support markdown
  inputAs?: 'color' | 'date' | 'datetime-local' | 'range' | 'textarea'
  enumChoices?: Array<string>
  enumPicker?: 'select' | 'radio' | 'checkbox' // default: select
}

export type ExternalCommandType =
  | 'logseq.command/run'
  | 'logseq.editor/cycle-todo'
  | 'logseq.editor/down'
  | 'logseq.editor/up'
  | 'logseq.editor/expand-block-children'
  | 'logseq.editor/collapse-block-children'
  | 'logseq.editor/open-file-in-default-app'
  | 'logseq.editor/open-file-in-directory'
  | 'logseq.editor/select-all-blocks'
  | 'logseq.editor/toggle-open-blocks'
  | 'logseq.editor/zoom-in'
  | 'logseq.editor/zoom-out'
  | 'logseq.editor/indent'
  | 'logseq.editor/outdent'
  | 'logseq.editor/copy'
  | 'logseq.editor/cut'
  | 'logseq.go/home'
  | 'logseq.go/journals'
  | 'logseq.go/keyboard-shortcuts'
  | 'logseq.go/next-journal'
  | 'logseq.go/prev-journal'
  | 'logseq.go/search'
  | 'logseq.go/search-in-page'
  | 'logseq.go/tomorrow'
  | 'logseq.go/backward'
  | 'logseq.go/forward'
  | 'logseq.search/re-index'
  | 'logseq.sidebar/clear'
  | 'logseq.sidebar/open-today-page'
  | 'logseq.ui/goto-plugins'
  | 'logseq.ui/select-theme-color'
  | 'logseq.ui/toggle-brackets'
  | 'logseq.ui/toggle-cards'
  | 'logseq.ui/toggle-contents'
  | 'logseq.ui/toggle-document-mode'
  | 'logseq.ui/toggle-help'
  | 'logseq.ui/toggle-left-sidebar'
  | 'logseq.ui/toggle-right-sidebar'
  | 'logseq.ui/toggle-settings'
  | 'logseq.ui/toggle-theme'
  | 'logseq.ui/toggle-wide-mode'
  | 'logseq.command-palette/toggle'

export type UserProxyTags = 'app' | 'editor' | 'db' | 'git' | 'ui' | 'assets'

export type SearchIndiceInitStatus = boolean
export type SearchBlockItem = { id: EntityID, uuid: BlockIdentity, content: string, page: EntityID }
export type SearchPageItem = string
export type SearchFileItem = string

export interface IPluginSearchServiceHooks {
  name: string
  options?: Record<string, any>

  onQuery: (
    graph: string,
    key: string,
    opts: Partial<{ limit: number }>
  ) =>
    Promise<{
      graph: string,
      key: string,
      blocks?: Array<Partial<SearchBlockItem>>,
      pages?: Array<SearchPageItem>,
      files?: Array<SearchFileItem>
    }>

  onIndiceInit: (graph: string) => Promise<SearchIndiceInitStatus>
  onIndiceReset: (graph: string) => Promise<void>
  onBlocksChanged: (graph: string, changes: { added: Array<SearchBlockItem>, removed: Array<EntityID> }) => Promise<void>
  onGraphRemoved: (graph: string, opts?: {}) => Promise<any>
}

/**
 * App level APIs
 */
export interface IAppProxy {
  /**
   * @added 0.0.4
   * @param key
   */
  getInfo: (key?: keyof AppInfo) => Promise<AppInfo | any>

  getUserInfo: () => Promise<AppUserInfo | null>
  getUserConfigs: () => Promise<AppUserConfigs>

  // services
  registerSearchService<T extends IPluginSearchServiceHooks>(s: T): void

  // commands
  registerCommand: (
    type: string,
    opts: {
      key: string
      label: string
      desc?: string
      palette?: boolean
      keybinding?: SimpleCommandKeybinding
    },
    action: SimpleCommandCallback
  ) => void

  registerCommandPalette: (
    opts: {
      key: string
      label: string
      keybinding?: SimpleCommandKeybinding
    },
    action: SimpleCommandCallback
  ) => void

  /**
   * Supported key names
   * @link https://gist.github.com/xyhp915/d1a6d151a99f31647a95e59cdfbf4ddc
   * @param keybinding
   * @param action
   */
  registerCommandShortcut: (
    keybinding: SimpleCommandKeybinding,
    action: SimpleCommandCallback
  ) => void

  /**
   * Supported all registered palette commands
   * @param type
   * @param args
   */
  invokeExternalCommand: (
    type: ExternalCommandType,
    ...args: Array<any>
  ) => Promise<void>

  /**
   * Call external plugin command provided by models or registerd commands
   * @added 0.0.13
   * @param type `xx-plugin-id.commands.xx-key`, `xx-plugin-id.models.xx-key`
   * @param args
   */
  invokeExternalPlugin: (
    type: string,
    ...args: Array<any>
  ) => Promise<unknown>

  /**
   * @added 0.0.13
   * @param pid
   */
  getExternalPlugin: (pid: string) => Promise<{} | null>

  /**
   * Get state from app store
   * valid state is here
   * https://github.com/logseq/logseq/blob/master/src/main/frontend/state.cljs#L27
   *
   * @example
   * ```ts
   * const isDocMode = await logseq.App.getStateFromStore('document/mode?')
   * ```
   * @param path
   */
  getStateFromStore: <T = any>(path: string | Array<string>) => Promise<T>
  setStateFromStore: (path: string | Array<string>, value: any) => Promise<void>

  // native
  relaunch: () => Promise<void>
  quit: () => Promise<void>
  openExternalLink: (url: string) => Promise<void>

  /**
   * @deprecated Using `logseq.Git.execCommand`
   * @link https://github.com/desktop/dugite/blob/master/docs/api/exec.md
   * @param args
   */
  execGitCommand: (args: string[]) => Promise<string>

  // graph
  getCurrentGraph: () => Promise<AppGraphInfo | null>
  getCurrentGraphConfigs: () => Promise<any>
  getCurrentGraphFavorites: () => Promise<Array<string> | null>
  getCurrentGraphRecent: () => Promise<Array<string> | null>

  // router
  pushState: (
    k: string,
    params?: Record<string, any>,
    query?: Record<string, any>
  ) => void
  replaceState: (
    k: string,
    params?: Record<string, any>,
    query?: Record<string, any>
  ) => void

  // ui
  queryElementById: (id: string) => Promise<string | boolean>

  /**
   * @added 0.0.5
   * @param selector
   */
  queryElementRect: (selector: string) => Promise<DOMRectReadOnly | null>

  /**
   * @deprecated Use `logseq.UI.showMsg` instead
   * @param content
   * @param status
   */
  showMsg: (
    content: string,
    status?: 'success' | 'warning' | 'error' | string
  ) => void

  setZoomFactor: (factor: number) => void
  setFullScreen: (flag: boolean | 'toggle') => void
  setLeftSidebarVisible: (flag: boolean | 'toggle') => void
  setRightSidebarVisible: (flag: boolean | 'toggle') => void
  clearRightSidebarBlocks: (opts?: { close: boolean }) => void

  registerUIItem: (
    type: 'toolbar' | 'pagebar',
    opts: { key: string; template: string }
  ) => void

  registerPageMenuItem: (
    tag: string,
    action: (e: IHookEvent & { page: string }) => void
  ) => void

  // hook events
  onCurrentGraphChanged: IUserHook
  onGraphAfterIndexed: IUserHook<{ repo: string }>
  onThemeModeChanged: IUserHook<{ mode: 'dark' | 'light' }>
  onThemeChanged: IUserHook<Partial<{ name: string, mode: string, pid: string, url: string }>>

  /**
   * provide ui slot to specific block with UUID
   *
   * @added 0.0.13
   */
  onBlockRendererSlotted: IUserConditionSlotHook<BlockUUID, Omit<BlockEntity, 'children' | 'page'>>

  /**
   * provide ui slot to block `renderer` macro for `{{renderer arg1, arg2}}`
   *
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-pomodoro-timer
   * @example
   * ```ts
   * // e.g. {{renderer :h1, hello world, green}}
   *
   * logseq.App.onMacroRendererSlotted(({ slot, payload: { arguments } }) => {
   *   let [type, text, color] = arguments
   *   if (type !== ':h1') return
   *    logseq.provideUI({
   *      key: 'h1-playground',
   *      slot, template: `
   *       <h2 style="color: ${color || 'red'}">${text}</h2>
   *      `,
   *   })
   * })
   * ```
   */
  onMacroRendererSlotted: IUserSlotHook<{
    payload: { arguments: Array<string>; uuid: string; [key: string]: any }
  }>

  onPageHeadActionsSlotted: IUserSlotHook
  onRouteChanged: IUserHook<{ path: string; template: string }>
  onSidebarVisibleChanged: IUserHook<{ visible: boolean }>

  // internal
  _installPluginHook: (pid: string, hook: string, opts?: any) => void
  _uninstallPluginHook: (pid: string, hookOrAll: string | boolean) => void
}

/**
 * Editor related APIs
 */
export interface IEditorProxy extends Record<string, any> {
  /**
   * register a custom command which will be added to the Logseq slash command list
   * @param tag - displayed name of command
   * @param action - can be a single callback function to run when the command is called, or an array of fixed commands with arguments
   *
   *
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-slash-commands
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
   * register a custom command in the block context menu (triggered by right-clicking the block dot)
   * @param label - displayed name of command
   * @param action - can be a single callback function to run when the command is called
   */
  registerBlockContextMenuItem: (
    label: string,
    action: BlockCommandCallback
  ) => unknown

  /**
   * Current it's only available for pdf viewer
   * @param label - displayed name of command
   * @param action - callback for the clickable item
   * @param opts - clearSelection: clear highlight selection when callback invoked
   */
  registerHighlightContextMenuItem: (
    label: string,
    action: SimpleCommandCallback,
    opts?: {
      clearSelection: boolean
    }
  ) => unknown

  // block related APIs

  checkEditing: () => Promise<BlockUUID | boolean>

  insertAtEditingCursor: (content: string) => Promise<void>

  restoreEditingCursor: () => Promise<void>

  exitEditingMode: (selectBlock?: boolean) => Promise<void>

  getEditingCursorPosition: () => Promise<BlockCursorPosition | null>

  getEditingBlockContent: () => Promise<string>

  getCurrentPage: () => Promise<PageEntity | BlockEntity | null>

  getCurrentBlock: () => Promise<BlockEntity | null>

  getSelectedBlocks: () => Promise<Array<BlockEntity> | null>

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

  /**
   * get all page/block linked references
   * @param srcPage
   */
  getPageLinkedReferences: (
    srcPage: PageIdentity
  ) => Promise<Array<[page: PageEntity, blocks: Array<BlockEntity>]> | null>

  /**
   * get flatten pages from top namespace
   * @param namespace
   */
  getPagesFromNamespace: (
    namespace: BlockPageName
  ) => Promise<Array<PageEntity> | null>

  /**
   * construct pages tree from namespace pages
   * @param namespace
   */
  getPagesTreeFromNamespace: (
    namespace: BlockPageName
  ) => Promise<Array<PageEntity> | null>

  /**
   * Create a unique UUID string which can then be assigned to a block.
   * @added 0.0.8
   */
  newBlockUUID: () => Promise<string>

  /**
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-reddit-hot-news
   *
   * @param srcBlock
   * @param content
   * @param opts
   */
  insertBlock: (
    srcBlock: BlockIdentity,
    content: string,
    opts?: Partial<{
      before: boolean
      sibling: boolean
      isPageBlock: boolean
      focus: boolean
      customUUID: string
      properties: {}
    }>
  ) => Promise<BlockEntity | null>

  /**
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-reddit-hot-news
   *
   * `keepUUID` will allow you to set a custom UUID for blocks by setting their properties.id
   */
  insertBatchBlock: (
    srcBlock: BlockIdentity,
    batch: IBatchBlock | Array<IBatchBlock>,
    opts?: Partial<{ before: boolean; sibling: boolean, keepUUID: boolean }>
  ) => Promise<Array<BlockEntity> | null>

  updateBlock: (
    srcBlock: BlockIdentity,
    content: string,
    opts?: Partial<{ properties: {} }>
  ) => Promise<void>

  removeBlock: (srcBlock: BlockIdentity) => Promise<void>

  getBlock: (
    srcBlock: BlockIdentity | EntityID,
    opts?: Partial<{ includeChildren: boolean }>
  ) => Promise<BlockEntity | null>

  /**
   * @example
   *
   * ```ts
   *  logseq.Editor.setBlockCollapsed('uuid', true)
   *  logseq.Editor.setBlockCollapsed('uuid', 'toggle')
   * ```
   * @param uuid
   * @param opts
   */
  setBlockCollapsed: (
    uuid: BlockUUID,
    opts: { flag: boolean | 'toggle' } | boolean | 'toggle'
  ) => Promise<void>

  getPage: (
    srcPage: PageIdentity | EntityID,
    opts?: Partial<{ includeChildren: boolean }>
  ) => Promise<PageEntity | null>

  createPage: (
    pageName: BlockPageName,
    properties?: {},
    opts?: Partial<{
      redirect: boolean
      createFirstBlock: boolean
      format: BlockEntity['format']
      journal: boolean
    }>
  ) => Promise<PageEntity | null>

  deletePage: (pageName: BlockPageName) => Promise<void>

  renamePage: (oldName: string, newName: string) => Promise<void>

  getAllPages: (repo?: string) => Promise<PageEntity[] | null>

  prependBlockInPage: (
    page: PageIdentity,
    content: string,
    opts?: Partial<{ properties: {} }>
  ) => Promise<BlockEntity | null>

  appendBlockInPage: (
    page: PageIdentity,
    content: string,
    opts?: Partial<{ properties: {} }>
  ) => Promise<BlockEntity | null>

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
  selectBlock: (srcBlock: BlockIdentity) => Promise<void>

  saveFocusedCodeEditorContent: () => Promise<void>

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
    blockId: BlockIdentity,
    opts?: { replaceState: boolean }
  ) => void

  openInRightSidebar: (uuid: BlockUUID) => void

  /**
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-a-translator
   */
  onInputSelectionEnd: IUserHook<{
    caret: any
    point: { x: number; y: number }
    start: number
    end: number
    text: string
  }>
}

/**
 * Datascript related APIs
 */
export interface IDBProxy {
  /**
   * Run a DSL query
   * @link https://docs.logseq.com/#/page/queries
   * @param dsl
   */
  q: <T = any>(dsl: string) => Promise<Array<T> | null>

  /**
   * Run a datascript query
   */
  datascriptQuery: <T = any>(query: string, ...inputs: Array<any>) => Promise<T>

  /**
   * Hook all transaction data of DB
   *
   * @added 0.0.2
   */
  onChanged: IUserHook<{
    blocks: Array<BlockEntity>
    txData: Array<IDatom>
    txMeta?: { outlinerOp: string; [key: string]: any }
  }>

  /**
   * Subscribe a specific block changed event
   *
   * @added 0.0.2
   */
  onBlockChanged(
    uuid: BlockUUID,
    callback: (
      block: BlockEntity,
      txData: Array<IDatom>,
      txMeta?: { outlinerOp: string; [key: string]: any }
    ) => void
  ): IUserOffHook
}

/**
 * Git related APIS
 */
export interface IGitProxy {
  /**
   * @added 0.0.2
   * @link https://github.com/desktop/dugite/blob/master/docs/api/exec.md
   * @param args
   */
  execCommand: (args: string[]) => Promise<IGitResult>

  loadIgnoreFile: () => Promise<string>
  saveIgnoreFile: (content: string) => Promise<void>
}

/**
 * UI related APIs
 */
export type UIMsgOptions = {
  key: string
  timeout: number // milliseconds. `0` indicate that keep showing
}

export type UIMsgKey = UIMsgOptions['key']

export interface IUIProxy {
  /**
   * @added 0.0.2
   *
   * @param content
   * @param status
   * @param opts
   */
  showMsg: (
    content: string,
    status?: 'success' | 'warning' | 'error' | string,
    opts?: Partial<UIMsgOptions>
  ) => Promise<UIMsgKey>

  closeMsg: (key: UIMsgKey) => void
}

/**
 * Assets related APIs
 */
export interface IAssetsProxy {
  /**
   * @added 0.0.2
   * @param exts
   */
  listFilesOfCurrentGraph(exts?: string | string[]): Promise<Array<{
    path: string
    size: number
    accessTime: number
    modifiedTime: number
    changeTime: number
    birthTime: number
  }>>

  /**
   * @example https://github.com/logseq/logseq/pull/6488
   * @added 0.0.10
   */
  makeSandboxStorage(): IAsyncStorage
}

export interface ILSPluginThemeManager {
  get themes(): Map<PluginLocalIdentity, Theme[]>

  registerTheme(id: PluginLocalIdentity, opt: Theme): Promise<void>

  unregisterTheme(id: PluginLocalIdentity, effect?: boolean): Promise<void>

  selectTheme(
    opt: Theme | LegacyTheme,
    options: { effect?: boolean; emit?: boolean }
  ): Promise<void>
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
  ready(model?: Record<string, any>): Promise<any>

  /**
   * @param callback - a function to run when the main Logseq app is ready
   */
  ready(callback?: (e: any) => void | {}): Promise<any>

  ready(
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
  provideModel(model: Record<string, any>): this

  /**
   * Set the theme for the main Logseq app
   */
  provideTheme(theme: Theme): this

  /**
   * Inject custom css for the main Logseq app
   *
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-awesome-fonts
   * @example
   * ```ts
   *   logseq.provideStyle(`
   *    @import url("https://at.alicdn.com/t/font_2409735_r7em724douf.css");
   *  )
   * ```
   */
  provideStyle(style: StyleString | StyleOptions): this

  /**
   * Inject custom UI at specific DOM node.
   * Event handlers can not be passed by string, so you need to create them in `provideModel`
   *
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-a-translator
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
  provideUI(ui: UIOptions): this

  /**
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-awesome-fonts
   *
   * @param schemas
   */
  useSettingsSchema(schemas: Array<SettingSchemaDesc>): this

  /**
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-awesome-fonts
   *
   * @param attrs
   */
  updateSettings(attrs: Record<string, any>): void

  onSettingsChanged<T = any>(cb: (a: T, b: T) => void): IUserOffHook

  showSettingsUI(): void

  hideSettingsUI(): void

  setMainUIAttrs(attrs: Record<string, any>): void

  /**
   * Set the style for the plugin's UI
   *
   * @example https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-awesome-fonts
   * @example
   * ```ts
   * logseq.setMainUIInlineStyle({
   *  position: 'fixed',
   *  zIndex: 11,
   * })
   * ```
   */
  setMainUIInlineStyle(style: CSS.Properties): void

  /**
   * show the plugin's UI
   */
  showMainUI(opts?: { autoFocus: boolean }): void

  /**
   * hide the plugin's UI
   */
  hideMainUI(opts?: { restoreEditingCursor: boolean }): void

  /**
   * toggle the plugin's UI
   */
  toggleMainUI(): void

  isMainUIVisible: boolean

  resolveResourceFullUrl(filePath: string): string

  App: IAppProxy & Record<string, any>
  Editor: IEditorProxy & Record<string, any>
  DB: IDBProxy
  Git: IGitProxy
  UI: IUIProxy
  Assets: IAssetsProxy

  Request: LSPluginRequest
  FileStorage: LSPluginFileStorage
  Experiments: LSPluginExperiments
}
