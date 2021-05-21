import EventEmitter from 'eventemitter3'
import * as CSS from 'csstype'
import { LSPluginCaller } from './LSPlugin.caller'
import { LSPluginUser } from './LSPlugin.user'

type PluginLocalIdentity = string

type ThemeOptions = {
  name: string
  url: string
  description?: string
  mode?: 'dark' | 'light'

  [key: string]: any
}

type StyleString = string;
type StyleOptions = {
  key?: string
  style: StyleString
}

type UIBaseOptions = {
  key?: string
  replace?: boolean
  template: string
}

type UIPathIdentity = {
  path: string // dom selector
}

type UISlotIdentity = {
  slot: string // slot key
}

type UISlotOptions = UIBaseOptions & UISlotIdentity
type UIPathOptions = UIBaseOptions & UIPathIdentity
type UIOptions = UIPathOptions | UISlotOptions

interface LSPluginPkgConfig {
  id: PluginLocalIdentity
  mode: 'shadow' | 'iframe'
  themes: Array<ThemeOptions>
  icon: string
}

interface LSPluginBaseInfo {
  id: string // should be unique
  mode: 'shadow' | 'iframe'

  settings: {
    disabled: boolean
    [key: string]: any
  },

  [key: string]: any
}

type IHookEvent = {
  [key: string]: any
}

type IUserHook<E = any> = (callback: (e: IHookEvent & E) => void) => void
type IUserSlotHook<E = any> = (callback: (e: IHookEvent & UISlotIdentity & E) => void) => void

type BlockID = number
type BlockUUID = string
type BlockUUIDTuple = ['uuid', BlockUUID]

type IEntityID = { id: BlockID }

interface AppUserConfigs {
  preferredFormat: 'markdown' | 'org'
  preferredLanguage: string
  preferredWorkflow: string

  [key: string]: any
}

interface BlockEntity {
  id: number // db id
  uuid: string
  anchor: string
  body: any
  children: Array<BlockEntity | BlockUUIDTuple>
  container: string
  content: string
  format: 'markdown' | 'org'
  file: IEntityID
  left: IEntityID
  level: number
  meta: { timestamps: any, properties: any, startPos: number, endPos: number }
  page: IEntityID
  parent: IEntityID
  title: Array<any>
  unordered: boolean

  [key: string]: any
}

type BlockIdentity = BlockUUID | Pick<BlockEntity, 'uuid'>
type BlockPageName = string
type SlashCommandActionCmd = 'editor/input' | 'editor/hook' | 'editor/clear-current-slash'
type SlashCommandAction = [cmd: SlashCommandActionCmd, ...args: any]

interface IAppProxy {
  getUserInfo: () => Promise<any>
  getUserConfigs: () => Promise<AppUserConfigs>

  // router
  pushState: (k: string, params?: {}) => void
  replaceState: (k: string, params?: {}) => void

  // ui
  showMsg: (content: string, status?: 'success' | 'warning' | string) => void
  setZoomFactor: (factor: number) => void

  // events
  onThemeModeChanged: IUserHook<{ mode: 'dark' | 'light' }>
  onPageFileMounted: IUserSlotHook
  onBlockRendererMounted: IUserSlotHook<{ uuid: BlockUUID }>
  onRouteChanged: IUserHook<{ path: string, template: string }>
  onSidebarVisibleChanged: IUserHook<{ visible: boolean }>
}

interface IEditorProxy {
  registerSlashCommand: (this: LSPluginUser, tag: string, actions: Array<SlashCommandAction>) => boolean
  registerBlockContextMenu: (this: LSPluginUser, tag: string, action: () => void) => boolean

  // block related APIs
  getCurrentPage: () => Promise<Partial<BlockEntity>>
  getCurrentBlock: () => Promise<BlockEntity>
  getCurrentPageBlocksTree: () => Promise<Array<BlockEntity>>
  getPageBlocksTree: (pageName: BlockPageName) => Promise<Array<BlockEntity>>

  insertBlock: (srcBlock: BlockIdentity | BlockPageName, content: string, opts?: Partial<{ isPageBlock: boolean, before: boolean, sibling: boolean, props: {} }>) => Promise<BlockEntity | null>
  updateBlock: (srcBlock: BlockIdentity, content: string, opts?: Partial<{ props: {} }>) => Promise<void>
  removeBlock: (srcBlock: BlockIdentity, opts?: Partial<{ includeChildren: boolean }>) => Promise<void>
  getBlock: (srcBlock: BlockIdentity | BlockID, opts?: Partial<{ includeChildren: boolean }>) => Promise<BlockEntity>
  moveBlock: (srcBlock: BlockIdentity, targetBlock: BlockIdentity, opts?: Partial<{ before: boolean, children: boolean }>) => Promise<void>

  upsertBlockProperty: (block: BlockIdentity, key: string, value: any) => Promise<void>
  removeBlockProperty: (block: BlockIdentity, key: string) => Promise<void>
  getBlockProperty: (block: BlockIdentity, key: string) => Promise<any>
  getBlockProperties: (block: BlockIdentity) => Promise<any>
}

interface IDBProxy {
  datascriptQuery: <T = any>(query: string) => Promise<T>
}

interface ILSPluginThemeManager extends EventEmitter {
  themes: Map<PluginLocalIdentity, Array<ThemeOptions>>

  registerTheme (id: PluginLocalIdentity, opt: ThemeOptions): Promise<void>

  unregisterTheme (id: PluginLocalIdentity): Promise<void>

  selectTheme (opt?: ThemeOptions): Promise<void>
}

type LSPluginUserEvents = 'ui:visible:changed' | 'settings:changed'

interface ILSPluginUser extends EventEmitter<LSPluginUserEvents> {
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
  beforeunload: (callback:() => Promise<void>) => void

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

  hideMainUI (): void

  toggleMainUI (): void

  isMainUIVisible: boolean

  App: IAppProxy
  Editor: IEditorProxy
  DB: IDBProxy
}
