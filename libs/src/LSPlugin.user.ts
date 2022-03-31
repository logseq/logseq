import { deepMerge, mergeSettingsWithSchema, safeSnakeCase, safetyPathJoin } from './helpers'
import { LSPluginCaller } from './LSPlugin.caller'
import {
  IAppProxy,
  IDBProxy,
  IEditorProxy,
  ILSPluginUser,
  LSPluginBaseInfo,
  LSPluginUserEvents,
  SlashCommandAction,
  BlockCommandCallback,
  StyleString,
  ThemeOptions,
  UIOptions,
  IHookEvent,
  BlockIdentity,
  BlockPageName,
  UIContainerAttrs,
  SimpleCommandCallback,
  SimpleCommandKeybinding,
  SettingSchemaDesc,
  IUserOffHook,
  IGitProxy,
  IUIProxy,
  UserProxyTags, BlockUUID,
  BlockEntity, IDatom
} from './LSPlugin'
import Debug from 'debug'
import * as CSS from 'csstype'
import EventEmitter from 'eventemitter3'
import { LSPluginFileStorage } from './modules/LSPlugin.Storage'
import { LSPluginExperiments } from './modules/LSPlugin.Experiments'

declare global {
  interface Window {
    __LSP__HOST__: boolean
    logseq: LSPluginUser
  }
}

const PROXY_CONTINUE = Symbol.for('proxy-continue')
const debug = Debug('LSPlugin:user')

/**
 * @param type (key of group commands)
 * @param opts
 * @param action
 */
function registerSimpleCommand (
  this: LSPluginUser,
  type: string,
  opts: {
    key: string,
    label: string,
    desc?: string,
    palette?: boolean,
    keybinding?: SimpleCommandKeybinding
  },
  action: SimpleCommandCallback
) {
  if (typeof action !== 'function') {
    return false
  }

  const { key, label, desc, palette, keybinding } = opts
  const eventKey = `SimpleCommandHook${key}${++registeredCmdUid}`

  this.Editor['on' + eventKey](action)

  this.caller?.call(`api:call`, {
    method: 'register-plugin-simple-command',
    args: [this.baseInfo.id, [{ key, label, type, desc, keybinding }, ['editor/hook', eventKey]], palette]
  })
}

const app: Partial<IAppProxy> = {
  registerCommand: registerSimpleCommand,

  registerCommandPalette (
    opts: { key: string; label: string, keybinding?: SimpleCommandKeybinding },
    action: SimpleCommandCallback) {

    const { key, label, keybinding } = opts
    const group = '$palette$'

    return registerSimpleCommand.call(
      this, group,
      { key, label, palette: true, keybinding },
      action)
  },

  registerCommandShortcut (
    keybinding: SimpleCommandKeybinding,
    action: SimpleCommandCallback
  ) {
    const { binding } = keybinding
    const group = '$shortcut$'
    const key = group + safeSnakeCase(binding)

    return registerSimpleCommand.call(
      this, group,
      { key, palette: false, keybinding},
      action)
  },

  registerUIItem (
    type: 'toolbar' | 'pagebar',
    opts: { key: string, template: string }
  ) {
    const pid = this.baseInfo.id
    // opts.key = `${pid}_${opts.key}`

    this.caller?.call(`api:call`, {
      method: 'register-plugin-ui-item',
      args: [pid, type, opts]
    })
  },

  registerPageMenuItem (
    this: LSPluginUser,
    tag: string,
    action: (e: IHookEvent & { page: string }) => void
  ) {
    if (typeof action !== 'function') {
      return false
    }

    const key = tag + '_' + this.baseInfo.id
    const label = tag
    const type = 'page-menu-item'

    registerSimpleCommand.call(this,
      type, {
        key, label
      }, action)
  },

  setFullScreen (flag) {
    const sf = (...args) => this._callWin('setFullScreen', ...args)

    if (flag === 'toggle') {
      this._callWin('isFullScreen').then(r => {
        r ? sf() : sf(true)
      })
    } else {
      flag ? sf(true) : sf()
    }
  }
}

let registeredCmdUid = 0

const editor: Partial<IEditorProxy> = {
  registerSlashCommand (
    this: LSPluginUser,
    tag: string,
    actions: BlockCommandCallback | Array<SlashCommandAction>
  ) {
    debug('Register slash command #', this.baseInfo.id, tag, actions)

    if (typeof actions === 'function') {
      actions = [
        ['editor/clear-current-slash', false],
        ['editor/restore-saved-cursor'],
        ['editor/hook', actions]
      ]
    }

    actions = actions.map((it) => {
      const [tag, ...args] = it

      switch (tag) {
        case 'editor/hook':
          let key = args[0]
          let fn = () => {
            this.caller?.callUserModel(key)
          }

          if (typeof key === 'function') {
            fn = key
          }

          const eventKey = `SlashCommandHook${tag}${++registeredCmdUid}`

          it[1] = eventKey

          // register command listener
          this.Editor['on' + eventKey](fn)
          break
        default:
      }

      return it
    })

    this.caller?.call(`api:call`, {
      method: 'register-plugin-slash-command',
      args: [this.baseInfo.id, [tag, actions]]
    })
  },

  registerBlockContextMenuItem (
    this: LSPluginUser,
    tag: string,
    action: BlockCommandCallback
  ) {
    if (typeof action !== 'function') {
      return false
    }

    const key = tag + '_' + this.baseInfo.id
    const label = tag
    const type = 'block-context-menu-item'

    registerSimpleCommand.call(this,
      type, {
        key, label
      }, action)
  },

  scrollToBlockInPage (
    this: LSPluginUser,
    pageName: BlockPageName,
    blockId: BlockIdentity
  ) {
    const anchor = `block-content-` + blockId
    this.App.pushState(
      'page',
      { name: pageName },
      { anchor }
    )
  }
}

const db: Partial<IDBProxy> = {
  onBlockChanged (
    this: LSPluginUser,
    uuid: BlockUUID,
    callback: (block: BlockEntity, txData: Array<IDatom>, txMeta?: { outlinerOp: string; [p: string]: any }) => void
  ): IUserOffHook {
    const pid = this.baseInfo.id
    const hook = `hook:db:${safeSnakeCase(`block:${uuid}`)}`
    const aBlockChange = ({block, txData, txMeta}) => {
      if (block.uuid !== uuid) {
        return
      }

      callback(block, txData, txMeta)
    }

    this.caller.on(hook, aBlockChange)
    this.App._installPluginHook(pid, hook)

    return () => {
      this.caller.off(hook, aBlockChange)
      this.App._uninstallPluginHook(pid, hook)
    }
  }
}

const git: Partial<IGitProxy> = {}
const ui: Partial<IUIProxy> = {}

type uiState = {
  key?: number,
  visible: boolean
}

const KEY_MAIN_UI = 0

/**
 * User plugin instance
 * @public
 */
export class LSPluginUser extends EventEmitter<LSPluginUserEvents> implements ILSPluginUser {
  // @ts-ignore
  private _version: string = LIB_VERSION
  private _debugTag: string = ''
  private _settingsSchema?: Array<SettingSchemaDesc>
  private _connected: boolean = false

  /**
   * ui frame identities
   * @private
   */
  private _ui = new Map<number, uiState>()

  private _mFileStorage: LSPluginFileStorage
  private _mExperiments: LSPluginExperiments

  /**
   * handler of before unload plugin
   * @private
   */
  private _beforeunloadCallback?: (e: any) => Promise<void>

  /**
   * @param _baseInfo
   * @param _caller
   */
  constructor (
    private _baseInfo: LSPluginBaseInfo,
    private _caller: LSPluginCaller
  ) {
    super()

    _caller.on('sys:ui:visible', (payload) => {
      if (payload?.toggle) {
        this.toggleMainUI()
      }
    })

    _caller.on('settings:changed', (payload) => {
      const b = Object.assign({}, this.settings)
      const a = Object.assign(this._baseInfo.settings, payload)
      this.emit('settings:changed', { ...a }, b)
    })

    _caller.on('beforeunload', async (payload) => {
      const { actor, ...rest } = payload
      const cb = this._beforeunloadCallback

      try {
        cb && await cb(rest)
        actor?.resolve(null)
      } catch (e) {
        console.debug(`${_caller.debugTag} [beforeunload] `, e)
        actor?.reject(e)
      }
    })
  }

  async ready (
    model?: any,
    callback?: any
  ) {
    if (this._connected) return

    try {
      if (typeof model === 'function') {
        callback = model
        model = {}
      }

      let baseInfo = await this._caller.connectToParent(model)

      this._connected = true

      baseInfo = deepMerge(this._baseInfo, baseInfo)

      if (this._settingsSchema) {
        baseInfo.settings = mergeSettingsWithSchema(
          baseInfo.settings, this._settingsSchema
        )

        // TODO: sync host settings schema
        await this.useSettingsSchema(this._settingsSchema)
      }

      if (baseInfo?.id) {
        this._debugTag = this._caller.debugTag = `#${baseInfo.id} [${baseInfo.name}]`
      }

      await this._execCallableAPIAsync('setSDKMetadata', {
        version: this._version
      })

      callback && callback.call(this, baseInfo)
    } catch (e) {
      console.error(`${this._debugTag} [Ready Error]`, e)
    }
  }

  ensureConnected () {
    if (!this._connected) {
      throw new Error('not connected')
    }
  }

  beforeunload (callback: (e: any) => Promise<void>): void {
    if (typeof callback !== 'function') return
    this._beforeunloadCallback = callback
  }

  provideModel (model: Record<string, any>) {
    this.caller._extendUserModel(model)
    return this
  }

  provideTheme (theme: ThemeOptions) {
    this.caller.call('provider:theme', theme)
    return this
  }

  provideStyle (style: StyleString) {
    this.caller.call('provider:style', style)
    return this
  }

  provideUI (ui: UIOptions) {
    this.caller.call('provider:ui', ui)
    return this
  }

  useSettingsSchema (schema: Array<SettingSchemaDesc>) {
    if (this.connected) {
      this.caller.call('settings:schema', {
        schema, isSync: true
      })
    }

    this._settingsSchema = schema
    return this
  }

  updateSettings (attrs: Record<string, any>) {
    this.caller.call('settings:update', attrs)
    // TODO: update associated baseInfo settings
  }

  onSettingsChanged<T = any> (cb: (a: T, b: T) => void): IUserOffHook {
    const type = 'settings:changed'
    this.on(type, cb)
    return () => this.off(type, cb)
  }

  showSettingsUI () {
    this.caller.call('settings:visible:changed', { visible: true })
  }

  hideSettingsUI () {
    this.caller.call('settings:visible:changed', { visible: false })
  }

  setMainUIAttrs (attrs: Partial<UIContainerAttrs>): void {
    this.caller.call('main-ui:attrs', attrs)
  }

  setMainUIInlineStyle (style: CSS.Properties): void {
    this.caller.call('main-ui:style', style)
  }

  hideMainUI (opts?: { restoreEditingCursor: boolean }): void {
    const payload = { key: KEY_MAIN_UI, visible: false, cursor: opts?.restoreEditingCursor }
    this.caller.call('main-ui:visible', payload)
    this.emit('ui:visible:changed', payload)
    this._ui.set(payload.key, payload)
  }

  showMainUI (opts?: { autoFocus: boolean }): void {
    const payload = { key: KEY_MAIN_UI, visible: true, autoFocus: opts?.autoFocus }
    this.caller.call('main-ui:visible', payload)
    this.emit('ui:visible:changed', payload)
    this._ui.set(payload.key, payload)
  }

  toggleMainUI (): void {
    const payload = { key: KEY_MAIN_UI, toggle: true }
    const state = this._ui.get(payload.key)
    if (state && state.visible) {
      this.hideMainUI()
    } else {
      this.showMainUI()
    }
  }

  get version (): string {
    return this._version
  }

  get isMainUIVisible (): boolean {
    const state = this._ui.get(KEY_MAIN_UI)
    return Boolean(state && state.visible)
  }

  get connected (): boolean {
    return this._connected
  }

  get baseInfo (): LSPluginBaseInfo {
    return this._baseInfo
  }

  get settings () {
    return this.baseInfo?.settings
  }

  get caller (): LSPluginCaller {
    return this._caller
  }

  resolveResourceFullUrl (filePath: string) {
    this.ensureConnected()
    if (!filePath) return
    filePath = filePath.replace(/^[.\\/]+/, '')
    return safetyPathJoin(this._baseInfo.lsr, filePath)
  }

  /**
   * @internal
   */
  _makeUserProxy (
    target: any,
    tag?: UserProxyTags
  ) {
    const that = this
    const caller = this.caller

    return new Proxy(target, {
      get (target: any, propKey, receiver) {
        const origMethod = target[propKey]

        return function (this: any, ...args: any) {
          if (origMethod) {
            const ret = origMethod.apply(that, args.concat(tag))
            if (ret !== PROXY_CONTINUE) return
          }

          // Handle hook
          if (tag) {
            const hookMatcher = propKey.toString().match(/^(once|off|on)/i)

            if (hookMatcher != null) {
              const f = hookMatcher[0].toLowerCase()
              const s = hookMatcher.input!
              const e = s.slice(f.length)
              const isOff = f === 'off'
              const pid = that.baseInfo.id

              const type = `hook:${tag}:${safeSnakeCase(e)}`
              const handler = args[0]
              caller[f](type, handler)

              if (isOff) {
                return () => {
                  caller.off(type, handler)
                  that.App._uninstallPluginHook(pid, type)
                }
              } else {
                return that.App._installPluginHook(pid, type)
              }
            }
          }

          let method = propKey as string

          if (['git', 'ui'].includes(tag)) {
            method = tag + '_' + method
          }

          // Call host
          return caller.callAsync(`api:call`, {
            tag, method, args: args
          })
        }
      }
    })
  }

  _execCallableAPIAsync (method, ...args) {
    return this._caller.callAsync(`api:call`, {
      method, args
    })
  }

  _execCallableAPI (method, ...args) {
    this._caller.call(`api:call`, {
      method, args
    })
  }

  _callWin (...args) {
    return this._execCallableAPIAsync(`_callMainWin`, ...args)
  }

  /**
   * The interface methods of {@link IAppProxy}
   */
  get App (): IAppProxy {
    return this._makeUserProxy(app, 'app')
  }

  get Editor (): IEditorProxy {
    return this._makeUserProxy(editor, 'editor')
  }

  get DB (): IDBProxy {
    return this._makeUserProxy(db, 'db')
  }

  get Git (): IGitProxy {
    return this._makeUserProxy(git, 'git')
  }

  get UI (): IUIProxy {
    return this._makeUserProxy(ui, 'ui')
  }

  get FileStorage (): LSPluginFileStorage {
    let m = this._mFileStorage
    if (!m) m = this._mFileStorage = new LSPluginFileStorage(this)
    return m
  }

  get Experiments (): LSPluginExperiments {
    let m = this._mExperiments
    if (!m) m = this._mExperiments = new LSPluginExperiments(this)
    return m
  }
}

export * from './LSPlugin'

/**
 * @internal
 */
export function setupPluginUserInstance (
  pluginBaseInfo: LSPluginBaseInfo,
  pluginCaller: LSPluginCaller
) {
  return new LSPluginUser(pluginBaseInfo, pluginCaller)
}

// entry of iframe mode
if (window.__LSP__HOST__ == null) {
  const caller = new LSPluginCaller(null)
  window.logseq = setupPluginUserInstance({} as any, caller)
}
