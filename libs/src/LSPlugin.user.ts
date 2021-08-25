import { deepMerge, safetyPathJoin } from './helpers'
import { LSPluginCaller } from './LSPlugin.caller'
import {
  IAppProxy, IDBProxy,
  IEditorProxy,
  ILSPluginUser,
  LSPluginBaseInfo,
  LSPluginUserEvents,
  SlashCommandAction,
  BlockCommandCallback,
  StyleString,
  ThemeOptions,
  UIOptions, IHookEvent, BlockIdentity,
  BlockPageName,
  UIFrameAttrs
} from './LSPlugin'
import Debug from 'debug'
import * as CSS from 'csstype'
import { snakeCase } from 'snake-case'
import EventEmitter from 'eventemitter3'
import { LSPluginFileStorage } from './modules/LSPlugin.Storage'

declare global {
  interface Window {
    __LSP__HOST__: boolean
  }
}

const PROXY_CONTINUE = Symbol.for('proxy-continue')
const debug = Debug('LSPlugin:user')

/**
 * @param type
 * @param opts
 * @param action
 */
function registerSimpleCommand (
  this: LSPluginUser,
  type: string,
  opts: {
    key: string,
    label: string
  },
  action: BlockCommandCallback
) {
  if (typeof action !== 'function') {
    return false
  }

  const { key, label } = opts
  const eventKey = `SimpleCommandHook${key}${++registeredCmdUid}`

  this.Editor['on' + eventKey](action)

  this.caller?.call(`api:call`, {
    method: 'register-plugin-simple-command',
    args: [this.baseInfo.id, [{ key, label, type }, ['editor/hook', eventKey]]]
  })
}

const app: Partial<IAppProxy> = {
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

const db: Partial<IDBProxy> = {}

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
  /**
   * @private
   */
  private _connected: boolean = false

  /**
   * ui frame identities
   * @private
   */
  private _ui = new Map<number, uiState>()

  private _fileStorage: LSPluginFileStorage

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

    // modules
    this._fileStorage = new LSPluginFileStorage(this)
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

      baseInfo = deepMerge(this._baseInfo, baseInfo)

      this._connected = true

      if (baseInfo?.id) {
        this._caller.debugTag = `#${baseInfo.id} [${baseInfo.name}]`
      }

      callback && callback.call(this, baseInfo)
    } catch (e) {
      console.error('[LSPlugin Ready Error]', e)
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

  updateSettings (attrs: Record<string, any>) {
    this.caller.call('settings:update', attrs)
    // TODO: update associated baseInfo settings
  }

  setMainUIAttrs (attrs: Partial<UIFrameAttrs>): void {
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

  showMainUI (): void {
    const payload = { key: KEY_MAIN_UI, visible: true }
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

  get isMainUIVisible (): boolean {
    const state = this._ui.get(0)
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
    tag?: 'app' | 'editor' | 'db'
  ) {
    const that = this
    const caller = this.caller

    return new Proxy(target, {
      get (target: any, propKey, receiver) {
        const origMethod = target[propKey]

        return function (this: any, ...args: any) {
          if (origMethod) {
            const ret = origMethod.apply(that, args)
            if (ret !== PROXY_CONTINUE) return
          }

          // Handle hook
          if (tag) {
            const hookMatcher = propKey.toString().match(/^(once|off|on)/i)

            if (hookMatcher != null) {
              const f = hookMatcher[0].toLowerCase()
              const s = hookMatcher.input!
              const e = s.slice(f.length)

              const type = `hook:${tag}:${snakeCase(e)}`
              const handler = args[0]
              caller[f](type, handler)
              return f !== 'off' ? () => (caller.off(type, handler)) : void 0
            }
          }

          // Call host
          return caller.callAsync(`api:call`, {
            method: propKey,
            args: args
          })
        }
      }
    })
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
    return this._makeUserProxy(db)
  }

  get FileStorage (): LSPluginFileStorage {
    return this._fileStorage
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

if (window.__LSP__HOST__ == null) { // Entry of iframe mode
  const caller = new LSPluginCaller(null)
  // @ts-ignore
  window.logseq = setupPluginUserInstance({} as any, caller)
}
