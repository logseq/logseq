import EventEmitter from 'eventemitter3'
import {
  deepMerge,
  setupInjectedStyle,
  genID,
  setupInjectedTheme,
  setupInjectedUI,
  deferred,
  invokeHostExportedApi,
  isObject, withFileProtocol,
  getSDKPathRoot,
  PROTOCOL_FILE, URL_LSP,
  safetyPathJoin,
  path, safetyPathNormalize
} from './helpers'
import * as pluginHelpers from './helpers'
import Debug from 'debug'
import {
  LSPluginCaller,
  LSPMSG_READY, LSPMSG_SYNC,
  LSPMSG, LSPMSG_SETTINGS,
  LSPMSG_ERROR_TAG, LSPMSG_BEFORE_UNLOAD, AWAIT_LSPMSGFn
} from './LSPlugin.caller'
import {
  ILSPluginThemeManager,
  LSPluginPkgConfig,
  StyleOptions,
  StyleString,
  ThemeOptions, UIFrameAttrs,
  UIOptions
} from './LSPlugin'
import { snakeCase } from 'snake-case'
import DOMPurify from 'dompurify'

const debug = Debug('LSPlugin:core')
const DIR_PLUGINS = 'plugins'

declare global {
  interface Window {
    LSPluginCore: LSPluginCore
  }
}

type DeferredActor = ReturnType<typeof deferred>
type LSPluginCoreOptions = {
  dotConfigRoot: string
}

/**
 * User settings
 */
class PluginSettings extends EventEmitter<'change'> {
  private _settings: Record<string, any> = {
    disabled: false
  }

  constructor (private _userPluginSettings: any) {
    super()

    Object.assign(this._settings, _userPluginSettings)
  }

  get<T = any> (k: string): T {
    return this._settings[k]
  }

  set (k: string | Record<string, any>, v?: any) {
    const o = deepMerge({}, this._settings)

    if (typeof k === 'string') {
      if (this._settings[k] == v) return
      this._settings[k] = v
    } else if (isObject(k)) {
      deepMerge(this._settings, k)
    } else {
      return
    }

    this.emit('change',
      Object.assign({}, this._settings), o)
  }

  toJSON () {
    return this._settings
  }
}

class PluginLogger extends EventEmitter<'change'> {
  private _logs: Array<[type: string, payload: any]> = []

  constructor (private _tag: string) {
    super()
  }

  write (type: string, payload: any[]) {
    let msg = payload.reduce((ac, it) => {
      if (it && it instanceof Error) {
        ac += `${it.message} ${it.stack}`
      } else {
        ac += it.toString()
      }
      return ac
    }, `[${this._tag}][${new Date().toLocaleTimeString()}] `)

    this._logs.push([type, msg])
    this.emit('change')
  }

  clear () {
    this._logs = []
    this.emit('change')
  }

  info (...args: any[]) {
    this.write('INFO', args)
  }

  error (...args: any[]) {
    this.write('ERROR', args)
  }

  warn (...args: any[]) {
    this.write('WARN', args)
  }

  toJSON () {
    return this._logs
  }
}

type UserPreferences = {
  theme: ThemeOptions
  externals: Array<string> // external plugin locations

  [key: string]: any
}

type PluginLocalOptions = {
  key?: string // Unique from Logseq Plugin Store
  entry: string // Plugin main file
  url: string // Plugin package absolute fs location
  name: string
  version: string
  mode: 'shadow' | 'iframe'
  settings?: PluginSettings
  logger?: PluginLogger
  effect?: boolean

  [key: string]: any
}

type PluginLocalUrl = Pick<PluginLocalOptions, 'url'> & { [key: string]: any }
type RegisterPluginOpts = PluginLocalOptions | PluginLocalUrl

type PluginLocalIdentity = string

enum PluginLocalLoadStatus {
  LOADING = 'loading',
  UNLOADING = 'unloading',
  LOADED = 'loaded',
  UNLOADED = 'unload',
  ERROR = 'error'
}

function initUserSettingsHandlers (pluginLocal: PluginLocal) {
  const _ = (label: string): any => `settings:${label}`

  pluginLocal.on(_('update'), (attrs) => {
    if (!attrs) return
    pluginLocal.settings?.set(attrs)
  })
}

function initMainUIHandlers (pluginLocal: PluginLocal) {
  const _ = (label: string): any => `main-ui:${label}`

  pluginLocal.on(_('visible'), ({ visible, toggle, cursor }) => {
    const el = pluginLocal.getMainUI()
    el?.classList[toggle ? 'toggle' : (visible ? 'add' : 'remove')]('visible')
    // pluginLocal.caller!.callUserModel(LSPMSG, { type: _('visible'), payload: visible })
    // auto focus frame
    if (visible) {
      if (!pluginLocal.shadow && el) {
        (el as HTMLIFrameElement).contentWindow?.focus()
      }
    }

    if (cursor) {
      invokeHostExportedApi('restore_editing_cursor')
    }
  })

  pluginLocal.on(_('attrs'), (attrs: Partial<UIFrameAttrs>) => {
    const el = pluginLocal.getMainUI()
    Object.entries(attrs).forEach(([k, v]) => {
      el?.setAttribute(k, v)
    })
  })

  pluginLocal.on(_('style'), (style: Record<string, any>) => {
    const el = pluginLocal.getMainUI()
    Object.entries(style).forEach(([k, v]) => {
      el!.style[k] = v
    })
  })
}

function initProviderHandlers (pluginLocal: PluginLocal) {
  let _ = (label: string): any => `provider:${label}`
  let themed = false

  pluginLocal.on(_('theme'), (theme: ThemeOptions) => {
    pluginLocal.themeMgr.registerTheme(
      pluginLocal.id,
      theme
    )

    if (!themed) {
      pluginLocal._dispose(() => {
        pluginLocal.themeMgr.unregisterTheme(pluginLocal.id)
      })

      themed = true
    }
  })

  pluginLocal.on(_('style'), (style: StyleString | StyleOptions) => {
    let key: string | undefined

    if (typeof style !== 'string') {
      key = style.key
      style = style.style
    }

    if (!style || !style.trim()) return

    pluginLocal._dispose(
      setupInjectedStyle(style, {
        'data-injected-style': key ? `${key}-${pluginLocal.id}` : '',
        'data-ref': pluginLocal.id
      })
    )
  })

  pluginLocal.on(_('ui'), (ui: UIOptions) => {
    pluginLocal._onHostMounted(() => {
      // safe template
      ui.template = DOMPurify.sanitize(
        ui.template, {
          ADD_TAGS: ['iframe'],
          ALLOW_UNKNOWN_PROTOCOLS: true,
          ADD_ATTR: ['allow', 'src', 'allowfullscreen', 'frameborder', 'scrolling']
        })

      pluginLocal._dispose(
        setupInjectedUI.call(pluginLocal,
          ui, {
            'data-ref': pluginLocal.id
          })
      )
    })
  })
}

function initApiProxyHandlers (pluginLocal: PluginLocal) {
  let _ = (label: string): any => `api:${label}`

  pluginLocal.on(_('call'), async (payload) => {
    let ret: any

    try {
      ret = await invokeHostExportedApi(payload.method, ...payload.args)
    } catch (e) {
      ret = {
        [LSPMSG_ERROR_TAG]: e,
      }
    }

    const { _sync } = payload

    if (pluginLocal.shadow) {
      if (payload.actor) {
        payload.actor.resolve(ret)
      }
      return
    }

    if (_sync != null) {
      const reply = (result: any) => {
        pluginLocal.caller?.callUserModel(LSPMSG_SYNC, {
          result, _sync
        })
      }

      Promise.resolve(ret).then(reply, reply)
    }
  })
}

function convertToLSPResource (fullUrl: string, dotPluginRoot: string) {
  if (
    dotPluginRoot &&
    fullUrl.startsWith(PROTOCOL_FILE + dotPluginRoot)
  ) {
    fullUrl = safetyPathJoin(
      URL_LSP, fullUrl.substr(PROTOCOL_FILE.length + dotPluginRoot.length))
  }
  return fullUrl
}

class IllegalPluginPackageError extends Error {
  constructor (message: string) {
    super(message)
    this.name = IllegalPluginPackageError.name
  }
}

class ExistedImportedPluginPackageError extends Error {
  constructor (message: string) {
    super(message)
    this.name = ExistedImportedPluginPackageError.name
  }
}

/**
 * Host plugin for local
 */
class PluginLocal
  extends EventEmitter<'loaded' | 'unloaded' | 'beforeunload' | 'error'> {

  private _disposes: Array<() => Promise<any>> = []
  private _id: PluginLocalIdentity
  private _status: PluginLocalLoadStatus = PluginLocalLoadStatus.UNLOADED
  private _loadErr?: Error
  private _localRoot?: string
  private _dotSettingsFile?: string
  private _caller?: LSPluginCaller

  /**
   * @param _options
   * @param _themeMgr
   * @param _ctx
   */
  constructor (
    private _options: PluginLocalOptions,
    private _themeMgr: ILSPluginThemeManager,
    private _ctx: LSPluginCore
  ) {
    super()

    this._id = _options.key || genID()

    initUserSettingsHandlers(this)
    initMainUIHandlers(this)
    initProviderHandlers(this)
    initApiProxyHandlers(this)
  }

  async _setupUserSettings () {
    const { _options } = this
    const logger = _options.logger = new PluginLogger('Loader')

    try {
      const [userSettingsFilePath, userSettings] = await invokeHostExportedApi('load_plugin_user_settings', this.id)
      this._dotSettingsFile = userSettingsFilePath

      const settings = _options.settings = new PluginSettings(userSettings)

      // observe settings
      settings.on('change', (a, b) => {
        debug('linked settings change', a)

        if (!a.disabled && b.disabled) {
          // Enable plugin
          this.load()
        }

        if (a.disabled && !b.disabled) {
          // Disable plugin
          this.unload()
        }

        if (a) {
          invokeHostExportedApi(`save_plugin_user_settings`, this.id, a)
        }
      })
    } catch (e) {
      debug('[load plugin user settings Error]', e)
      logger?.error(e)
    }
  }

  getMainUI (): HTMLElement | undefined {
    if (this.shadow) {
      return this.caller?._getSandboxShadowContainer()
    }

    return this.caller?._getSandboxIframeContainer()
  }

  _resolveResourceFullUrl (filePath: string, localRoot?: string) {
    if (!filePath?.trim()) return
    localRoot = localRoot || this._localRoot
    const reg = /^(http|file)/
    if (!reg.test(filePath)) {
      const url = path.join(localRoot, filePath)
      filePath = reg.test(url) ? url : (PROTOCOL_FILE + url)
    }
    return (!this.options.effect && this.isInstalledInDotRoot) ?
      convertToLSPResource(filePath, this.dotPluginsRoot) : filePath
  }

  async _preparePackageConfigs () {
    const { url } = this._options
    let pkg: any

    try {
      if (!url) {
        throw new Error('Can not resolve package config location')
      }

      debug('prepare package root', url)

      pkg = await invokeHostExportedApi('load_plugin_config', url)

      if (!pkg || (pkg = JSON.parse(pkg), !pkg)) {
        throw new Error(`Parse package config error #${url}/package.json`)
      }
    } catch (e) {
      throw new IllegalPluginPackageError(e.message)
    }

    // Pick legal attrs
    ['name', 'author', 'repository', 'version',
      'description', 'repo', 'title', 'effect'
    ].forEach(k => {
      this._options[k] = pkg[k]
    })

    const localRoot = this._localRoot = safetyPathNormalize(url)
    const logseq: Partial<LSPluginPkgConfig> = pkg.logseq || {}
    const validateMain = (main) => main && /\.(js|html)$/.test(main)

    // Entry from main
    if (validateMain(pkg.main)) { // Theme has no main
      this._options.entry = this._resolveResourceFullUrl(pkg.main, localRoot)

      if (logseq.mode) {
        this._options.mode = logseq.mode
      }
    }

    const title = logseq.title || pkg.title
    const icon = logseq.icon || pkg.icon

    this._options.title = title
    this._options.icon = icon &&
      this._resolveResourceFullUrl(icon)

    // TODO: strategy for Logseq plugins center
    if (this.isInstalledInDotRoot) {
      this._id = path.basename(localRoot)
    } else {
      if (logseq.id) {
        this._id = logseq.id
      } else {
        logseq.id = this.id
        try {
          await invokeHostExportedApi('save_plugin_config', url, { ...pkg, logseq })
        } catch (e) {
          debug('[save plugin ID Error] ', e)
        }
      }
    }

    // Validate id
    const { registeredPlugins, isRegistering } = this._ctx
    if (isRegistering && registeredPlugins.has(logseq.id)) {
      throw new ExistedImportedPluginPackageError('prepare package Error')
    }

    return async () => {
      try {
        // 0. Install Themes
        let themes = logseq.themes

        if (themes) {
          await this._loadConfigThemes(
            Array.isArray(themes) ? themes : [themes]
          )
        }
      } catch (e) {
        debug('[prepare package effect Error]', e)
      }
    }
  }

  async _tryToNormalizeEntry () {
    let { entry, settings } = this.options
    let devEntry = settings?.get('_devEntry')

    if (devEntry) {
      this._options.entry = devEntry
      return
    }

    if (!entry.endsWith('.js')) return

    let dirPathInstalled = null
    let tmp_file_method = 'write_user_tmp_file'
    if (this.isInstalledInDotRoot) {
      tmp_file_method = 'write_dotdir_file'
      dirPathInstalled = this._localRoot.replace(this.dotPluginsRoot, '')
      dirPathInstalled = path.join(DIR_PLUGINS, dirPathInstalled)
    }
    let sdkPathRoot = await getSDKPathRoot()
    let entryPath = await invokeHostExportedApi(
      tmp_file_method,
      `${this._id}_index.html`,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>logseq plugin entry</title>
    <script src="${sdkPathRoot}/lsplugin.user.js"></script>
  </head>
  <body>
  <div id="app"></div>
  <script src="${entry}"></script>
  </body>
</html>`, dirPathInstalled)

    entry = convertToLSPResource(
      withFileProtocol(path.normalize(entryPath)),
      this.dotPluginsRoot
    )

    this._options.entry = entry
  }

  async _loadConfigThemes (themes: Array<ThemeOptions>) {
    themes.forEach((options) => {
      if (!options.url) return

      if (!options.url.startsWith('http') && this._localRoot) {
        options.url = path.join(this._localRoot, options.url)
        // file:// for native
        if (!options.url.startsWith('file:')) {
          options.url = 'assets://' + options.url
        }
      }

      // @ts-ignore
      this.emit('provider:theme', options)
    })
  }

  async load (readyIndicator?: DeferredActor) {
    if (this.pending) {
      return
    }

    this._status = PluginLocalLoadStatus.LOADING
    this._loadErr = undefined

    try {
      // if (!this.options.entry) { // Themes package no entry field
      // }

      let installPackageThemes = await this._preparePackageConfigs()

      if (!this.settings) {
        await this._setupUserSettings()
      }

      if (!this.disabled) {
        await installPackageThemes.call(null)
      }

      if (this.disabled || !this.options.entry) {
        return
      }

      await this._tryToNormalizeEntry()

      this._caller = new LSPluginCaller(this)
      await this._caller.connectToChild()

      const readyFn = () => {
        this._caller?.callUserModel(LSPMSG_READY)
      }

      if (readyIndicator) {
        readyIndicator.promise.then(readyFn)
      } else {
        readyFn()
      }

      this._disposes.push(async () => {
        await this._caller?.destroy()
      })
    } catch (e) {
      debug('[Load Plugin Error] ', e)
      this.logger?.error(e)

      this._status = PluginLocalLoadStatus.ERROR
      this._loadErr = e
    } finally {
      if (!this._loadErr) {
        if (this.disabled) {
          this._status = PluginLocalLoadStatus.UNLOADED
        } else {
          this._status = PluginLocalLoadStatus.LOADED
        }
      }
    }
  }

  async reload () {
    if (this.pending) {
      return
    }

    this._ctx.emit('beforereload', this)
    await this.unload()
    await this.load()
    this._ctx.emit('reloaded', this)
  }

  /**
   * @param unregister If true delete plugin files
   */
  async unload (unregister: boolean = false) {
    if (this.pending) {
      return
    }

    if (unregister) {
      await this.unload()

      if (this.isInstalledInDotRoot) {
        this._ctx.emit('unlink-plugin', this.id)
      }

      return
    }

    try {
      this._status = PluginLocalLoadStatus.UNLOADING

      const eventBeforeUnload = { unregister }

      // sync call
      try {
        await this._caller?.callUserModel(AWAIT_LSPMSGFn(LSPMSG_BEFORE_UNLOAD), eventBeforeUnload)
        this.emit('beforeunload', eventBeforeUnload)
      } catch (e) {
        console.error('[beforeunload Error]', e)
      }

      await this.dispose()

      this.emit('unloaded')
    } catch (e) {
      debug('[plugin unload Error]', e)
      return false
    } finally {
      this._status = PluginLocalLoadStatus.UNLOADED
    }
  }

  private async dispose () {
    for (const fn of this._disposes) {
      try {
        fn && (await fn())
      } catch (e) {
        console.error(this.debugTag, 'dispose Error', e)
      }
    }

    // clear
    this._disposes = []
  }

  _dispose (fn: any) {
    if (!fn) return
    this._disposes.push(fn)
  }

  _onHostMounted (callback: () => void) {
    const actor = this._ctx.hostMountedActor

    if (!actor || actor.settled) {
      callback()
    } else {
      actor?.promise.then(callback)
    }
  }

  get isInstalledInDotRoot () {
    const dotRoot = this.dotConfigRoot
    const plgRoot = this.localRoot
    return dotRoot && plgRoot && plgRoot.startsWith(dotRoot)
  }

  get loaded () {
    return this._status === PluginLocalLoadStatus.LOADED
  }

  get pending () {
    return [PluginLocalLoadStatus.LOADING, PluginLocalLoadStatus.UNLOADING]
      .includes(this._status)
  }

  get status (): PluginLocalLoadStatus {
    return this._status
  }

  get settings () {
    return this.options.settings
  }

  get logger () {
    return this.options.logger
  }

  get disabled () {
    return this.settings?.get('disabled')
  }

  get caller () {
    return this._caller
  }

  get id (): string {
    return this._id
  }

  get shadow (): boolean {
    return this.options.mode === 'shadow'
  }

  get options (): PluginLocalOptions {
    return this._options
  }

  get themeMgr (): ILSPluginThemeManager {
    return this._themeMgr
  }

  get debugTag () {
    const name = this._options?.name
    return `#${this._id} ${name ?? ''}`
  }

  get localRoot (): string {
    return this._localRoot || this._options.url
  }

  get loadErr (): Error | undefined {
    return this._loadErr
  }

  get dotConfigRoot () {
    return path.normalize(this._ctx.options.dotConfigRoot)
  }

  get dotSettingsFile (): string | undefined {
    return this._dotSettingsFile
  }

  get dotPluginsRoot () {
    return path.join(this.dotConfigRoot, DIR_PLUGINS)
  }

  toJSON () {
    const json = { ...this.options } as any
    json.id = this.id
    json.err = this.loadErr
    json.usf = this.dotSettingsFile
    json.iir = this.isInstalledInDotRoot
    json.lsr = this._resolveResourceFullUrl('')
    return json
  }
}

/**
 * Host plugin core
 */
class LSPluginCore
  extends EventEmitter<'beforeenable' | 'enabled' | 'beforedisable' | 'disabled' | 'registered' | 'error' | 'unregistered' |
    'theme-changed' | 'theme-selected' | 'settings-changed' | 'unlink-plugin' | 'beforereload' | 'reloaded'>
  implements ILSPluginThemeManager {

  private _isRegistering = false
  private _readyIndicator?: DeferredActor
  private _hostMountedActor: DeferredActor = deferred()
  private _userPreferences: Partial<UserPreferences> = {}
  private _registeredThemes = new Map<PluginLocalIdentity, Array<ThemeOptions>>()
  private _registeredPlugins = new Map<PluginLocalIdentity, PluginLocal>()
  private _currentTheme: { dis: () => void, pid: PluginLocalIdentity, opt: ThemeOptions }

  /**
   * @param _options
   */
  constructor (private _options: Partial<LSPluginCoreOptions>) {
    super()
  }

  async loadUserPreferences () {
    try {
      const settings = await invokeHostExportedApi(`load_user_preferences`)

      if (settings) {
        Object.assign(this._userPreferences, settings)
      }
    } catch (e) {
      debug('[load user preferences Error]', e)
    }
  }

  async saveUserPreferences (settings: Partial<UserPreferences>) {
    try {
      if (settings) {
        Object.assign(this._userPreferences, settings)
      }

      await invokeHostExportedApi(`save_user_preferences`, this._userPreferences)
    } catch (e) {
      debug('[save user preferences Error]', e)
    }
  }

  async activateUserPreferences () {
    const { theme } = this._userPreferences

    // 0. theme
    if (theme) {
      await this.selectTheme(theme, false)
    }
  }

  /**
   * @param plugins
   * @param initial
   */
  async register (
    plugins: Array<RegisterPluginOpts> | RegisterPluginOpts,
    initial = false
  ) {
    if (!Array.isArray(plugins)) {
      await this.register([plugins])
      return
    }

    const perfTable = new Map<string, { o: PluginLocal, s: number, e: number }>()
    const debugPerfInfo = () => {
      const data = Array.from(perfTable.values()).reduce((ac, it) => {
        const { options, status, disabled } = it.o

        ac[it.o.id] = {
          name: options.name,
          entry: options.entry,
          status: status,
          enabled: typeof disabled === 'boolean' ? (!disabled ? '🟢' : '⚫️') : '🔴',
          perf: !it.e ? it.o.loadErr : `${(it.e - it.s).toFixed(2)}ms`
        }

        return ac
      }, {})

      console.table(data)
    }

    // @ts-ignore
    window.__debugPluginsPerfInfo = debugPerfInfo

    try {
      this._isRegistering = true

      const userConfigRoot = this._options.dotConfigRoot
      const readyIndicator = this._readyIndicator = deferred()

      await this.loadUserPreferences()

      const externals = new Set(this._userPreferences.externals || [])

      if (initial) {
        plugins = plugins.concat([...externals].filter(url => {
          return !plugins.length || (plugins as RegisterPluginOpts[]).every((p) => !p.entry && (p.url !== url))
        }).map(url => ({ url })))
      }

      for (const pluginOptions of plugins) {
        const { url } = pluginOptions as PluginLocalOptions
        const pluginLocal = new PluginLocal(pluginOptions as PluginLocalOptions, this, this)

        const perfInfo = { o: pluginLocal, s: performance.now(), e: 0 }
        perfTable.set(pluginLocal.id, perfInfo)

        await pluginLocal.load(readyIndicator)

        const { loadErr } = pluginLocal

        if (loadErr) {
          debug(`[Failed LOAD Plugin] #`, pluginOptions)

          this.emit('error', loadErr)

          if (
            loadErr instanceof IllegalPluginPackageError ||
            loadErr instanceof ExistedImportedPluginPackageError) {
            // TODO: notify global log system?
            continue
          }
        }

        perfInfo.e = performance.now()

        pluginLocal.settings?.on('change', (a) => {
          this.emit('settings-changed', pluginLocal.id, a)
          pluginLocal.caller?.callUserModel(LSPMSG_SETTINGS, { payload: a })
        })

        this._registeredPlugins.set(pluginLocal.id, pluginLocal)
        this.emit('registered', pluginLocal)

        // external plugins
        if (!pluginLocal.isInstalledInDotRoot) {
          externals.add(url)
        }
      }

      await this.saveUserPreferences({ externals: Array.from(externals) })
      await this.activateUserPreferences()

      readyIndicator.resolve('ready')
    } catch (e) {
      console.error(e)
    } finally {
      this._isRegistering = false
      debugPerfInfo()
    }
  }

  async reload (plugins: Array<PluginLocalIdentity> | PluginLocalIdentity) {
    if (!Array.isArray(plugins)) {
      await this.reload([plugins])
      return
    }

    for (const identity of plugins) {
      try {
        const p = this.ensurePlugin(identity)
        await p.reload()
      } catch (e) {
        debug(e)
      }
    }
  }

  async unregister (plugins: Array<PluginLocalIdentity> | PluginLocalIdentity) {
    if (!Array.isArray(plugins)) {
      await this.unregister([plugins])
      return
    }

    const unregisteredExternals: Array<string> = []

    for (const identity of plugins) {
      const p = this.ensurePlugin(identity)

      if (!p.isInstalledInDotRoot) {
        unregisteredExternals.push(p.options.url)
      }

      await p.unload(true)

      this._registeredPlugins.delete(identity)
      this.emit('unregistered', identity)
    }

    let externals = this._userPreferences.externals || []
    if (externals.length && unregisteredExternals.length) {
      await this.saveUserPreferences({
        externals: externals.filter((it) => {
          return !unregisteredExternals.includes(it)
        })
      })
    }
  }

  async enable (plugin: PluginLocalIdentity) {
    const p = this.ensurePlugin(plugin)
    if (p.pending) return

    this.emit('beforeenable')
    p.settings?.set('disabled', false)
    this.emit('enabled', p.id)
  }

  async disable (plugin: PluginLocalIdentity) {
    const p = this.ensurePlugin(plugin)
    if (p.pending) return

    this.emit('beforedisable')
    p.settings?.set('disabled', true)
    this.emit('disabled', p.id)
  }

  async _hook (ns: string, type: string, payload?: any, pid?: string) {
    for (const [_, p] of this._registeredPlugins) {
      if (!pid || pid === p.id) {
        p.caller?.callUserModel(LSPMSG, {
          ns, type: snakeCase(type), payload
        })
      }
    }
  }

  hookApp (type: string, payload?: any, pid?: string) {
    this._hook(`hook:app`, type, payload, pid)
  }

  hookEditor (type: string, payload?: any, pid?: string) {
    this._hook(`hook:editor`, type, payload, pid)
  }

  _execDirective (tag: string, ...params: any[]) {

  }

  ensurePlugin (plugin: PluginLocalIdentity | PluginLocal) {
    if (plugin instanceof PluginLocal) {
      return plugin
    }

    const p = this._registeredPlugins.get(plugin)

    if (!p) {
      throw new Error(`plugin #${plugin} not existed.`)
    }

    return p
  }

  hostMounted () {
    this._hostMountedActor.resolve()
  }

  get registeredPlugins (): Map<PluginLocalIdentity, PluginLocal> {
    return this._registeredPlugins
  }

  get options () {
    return this._options
  }

  get readyIndicator (): DeferredActor | undefined {
    return this._readyIndicator
  }

  get hostMountedActor (): DeferredActor {
    return this._hostMountedActor
  }

  get isRegistering (): boolean {
    return this._isRegistering
  }

  get themes (): Map<PluginLocalIdentity, Array<ThemeOptions>> {
    return this._registeredThemes
  }

  async registerTheme (id: PluginLocalIdentity, opt: ThemeOptions): Promise<void> {
    debug('registered Theme #', id, opt)

    if (!id) return
    let themes: Array<ThemeOptions> = this._registeredThemes.get(id)!
    if (!themes) {
      this._registeredThemes.set(id, themes = [])
    }

    themes.push(opt)
    this.emit('theme-changed', this.themes, { id, ...opt })
  }

  async selectTheme (opt?: ThemeOptions, effect = true): Promise<void> {
    // clear current
    if (this._currentTheme) {
      this._currentTheme.dis?.()
    }

    const disInjectedTheme = setupInjectedTheme(opt?.url)
    this.emit('theme-selected', opt)
    effect && await this.saveUserPreferences({ theme: opt?.url ? opt : null })
    if (opt?.url) {
      this._currentTheme = {
        dis: () => {
          disInjectedTheme()
          effect && this.saveUserPreferences({ theme: null })
        }, opt, pid: opt.pid
      }
    }
  }

  async unregisterTheme (id: PluginLocalIdentity, effect: boolean = true): Promise<void> {
    debug('unregistered Theme #', id)

    if (!this._registeredThemes.has(id)) return
    this._registeredThemes.delete(id)
    this.emit('theme-changed', this.themes, { id })
    if (effect && this._currentTheme?.pid == id) {
      this._currentTheme.dis?.()
      this._currentTheme = null
      // reset current theme
      this.emit('theme-selected', null)
    }
  }
}

function setupPluginCore (options: any) {
  const pluginCore = new LSPluginCore(options)

  debug('=== 🔗 Setup Logseq Plugin System 🔗 ===')

  window.LSPluginCore = pluginCore
}

export {
  PluginLocal,
  pluginHelpers,
  setupPluginCore
}
