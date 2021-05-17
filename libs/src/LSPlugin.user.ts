import { deepMerge, invokeHostExportedApi } from './helpers'
import { LSPluginCaller } from './LSPlugin.caller'
import {
  IAppProxy, IDBProxy,
  IEditorProxy,
  ILSPluginUser,
  LSPluginBaseInfo, LSPluginUserEvents, SlashCommandAction,
  StyleString,
  ThemeOptions,
  UIOptions
} from './LSPlugin'
import Debug from 'debug'
import { snakeCase } from 'snake-case'
import EventEmitter from 'eventemitter3'

declare global {
  interface Window {
    __LSP__HOST__: boolean
    logseq: ILSPluginUser
  }
}

const debug = Debug('LSPlugin:user')

const app: Partial<IAppProxy> = {}

let registeredCmdUid = 0

const editor: Partial<IEditorProxy> = {
  registerSlashCommand (
    this: LSPluginUser,
    tag: string,
    actions: Array<SlashCommandAction>
  ) {
    debug('Register slash command #', this.baseInfo.id, tag, actions)

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

    return false
  },

  registerBlockContextMenu (
    this: LSPluginUser,
    tag: string,
    action: () => void
  ): boolean {
    if (typeof action !== 'function') {
      return false
    }

    const key = tag
    const label = tag
    const type = 'block-context-menu'
    const eventKey = `SimpleCommandHook${tag}${++registeredCmdUid}`

    this.Editor['on' + eventKey](action)

    this.caller?.call(`api:call`, {
      method: 'register-plugin-simple-command',
      args: [this.baseInfo.id, [{ key, label, type }, ['editor/hook', eventKey]]]
    })

    return false
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
 */
export class LSPluginUser extends EventEmitter<LSPluginUserEvents> implements ILSPluginUser {
  /**
   * Indicate connected with host
   * @private
   */
  private _connected: boolean = false
  private _ui = new Map<number, uiState>()

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

      callback && callback.call(this, baseInfo)
    } catch (e) {
      console.error('[LSPlugin Ready Error]', e)
    }
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

  setMainUIAttrs (attrs: Record<string, any>): void {
    this.caller.call('main-ui:attrs', attrs)
  }

  setMainUIInlineStyle (style: CSSStyleDeclaration): void {
    this.caller.call('main-ui:style', style)
  }

  hideMainUI (): void {
    const payload = { key: KEY_MAIN_UI, visible: false }
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
            if (ret === false) return
          }

          // Handle hook
          if (tag) {
            const hookMatcher = propKey.toString().match(/^(once|off|on)/i)

            if (hookMatcher != null) {
              const f = hookMatcher[0]
              const s = hookMatcher.input!
              const e = s.slice(f.length)

              caller[f.toLowerCase()](`hook:${tag}:${snakeCase(e)}`, args[0])
              return
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

  get App (): IAppProxy {
    return this._makeUserProxy(app, 'app')
  }

  get Editor () {
    return this._makeUserProxy(editor, 'editor')
  }

  get DB (): IDBProxy {
    return this._makeUserProxy(db)
  }
}

export function setupPluginUserInstance (
  pluginBaseInfo: LSPluginBaseInfo,
  pluginCaller: LSPluginCaller
) {
  return new LSPluginUser(pluginBaseInfo, pluginCaller)
}

if (window.__LSP__HOST__ == null) { // Entry of iframe mode
  const caller = new LSPluginCaller(null)
  window.logseq = setupPluginUserInstance({} as any, caller)
}
