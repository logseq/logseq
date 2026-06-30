import * as CSS from 'csstype'

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
  /**
   * Alternative entrypoint for development.
   */
  devEntry: string
  /**
   * For legacy themes, do not use.
   */
  theme: unknown
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

type EntityID = number
type BlockUUID = string
type BlockIdentity = BlockUUID | { uuid: BlockUUID }

export type SearchIndiceInitStatus = boolean
export type SearchBlockItem = {
  id: EntityID
  uuid: BlockIdentity
  content: string
  page: EntityID
}
export type SearchPageItem = string
export type SearchFileItem = string

export interface IPluginSearchServiceHooks {
  name: string
  options?: Record<string, any>

  onQuery: (
    graph: string,
    key: string,
    opts: Partial<{ limit: number }>
  ) => Promise<{
    graph: string
    key: string
    blocks?: Array<Partial<SearchBlockItem>>
    pages?: Array<SearchPageItem>
    files?: Array<SearchFileItem>
  }>

  onIndiceInit: (graph: string) => Promise<SearchIndiceInitStatus>
  onIndiceReset: (graph: string) => Promise<void>
  onBlocksChanged: (
    graph: string,
    changes: {
      added: Array<SearchBlockItem>
      removed: Array<EntityID>
    }
  ) => Promise<void>
  onGraphRemoved: (graph: string, opts?: {}) => Promise<any>
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
