import Debug from 'debug'
import { Postmate, Model, ParentAPI, ChildAPI } from './postmate'
import EventEmitter from 'eventemitter3'
import { PluginLocal } from './LSPlugin.core'
import { deferred, IS_DEV } from './common'
import { LSPluginShadowFrame } from './LSPlugin.shadow'

const debug = Debug('LSPlugin:caller')

type DeferredActor = ReturnType<typeof deferred>

export const FLAG_AWAIT = '#await#response#'
export const LSPMSG = '#lspmsg#'
export const LSPMSG_ERROR_TAG = '#lspmsg#error#'
export const LSPMSG_SETTINGS = '#lspmsg#settings#'
export const LSPMSG_BEFORE_UNLOAD = '#lspmsg#beforeunload#'
export const LSPMSG_SYNC = '#lspmsg#reply#'
export const LSPMSG_READY = '#lspmsg#ready#'
export const LSPMSGFn = (id: string) => `${LSPMSG}${id}`
export const AWAIT_LSPMSGFn = (id: string) => `${FLAG_AWAIT}${id}`

const HEAD_BAR_HEIGHT = 45
const MAX_LAYOUT_PERCENT = 99

/**
 * Call between core and user
 */
class LSPluginCaller extends EventEmitter {
  private _connected: boolean = false

  private _parent?: ParentAPI
  private _child?: ChildAPI

  private _shadow?: LSPluginShadowFrame

  private _status?: 'pending' | 'timeout'
  private _userModel: any = {}
  private _syncGCTimer: any = null

  private _call?: (
    type: string,
    payload: any,
    actor?: DeferredActor,
  ) => Promise<any>
  private _callUserModel?: (type: string, ...payloads: any[]) => Promise<any>

  private _debugTag = ''

  constructor(private _pluginLocal: PluginLocal | null) {
    super()

    if (_pluginLocal) {
      this._debugTag = _pluginLocal.debugTag
    }
  }

  // run in host
  async connectToChild() {
    if (this._connected) return

    const { shadow } = this._pluginLocal!

    if (shadow) {
      await this._setupShadowSandbox()
    } else {
      await this._setupIframeSandbox()
    }
  }

  // run in sandbox
  async connectToParent(userModel = {}) {
    if (this._connected) return

    const caller = this
    const isShadowMode = this._pluginLocal != null

    let syncTag = 0
    const syncActors = new Map<number, DeferredActor>()
    const readyDeferred = deferred(1000 * 60)

    const model: any = this._extendUserModel({
      [LSPMSG_READY]: async (baseInfo: any) => {
        // dynamically setup common msg handler
        model[LSPMSGFn(baseInfo?.pid)] = ({
          type,
          payload,
        }: {
          type: string
          payload: any
        }) => {
          debug(`[host (_call) -> *user] ${this._debugTag}`, type, payload)
          // host._call without async
          caller.emit(type, payload)
        }

        await readyDeferred.resolve()
      },

      [LSPMSG_BEFORE_UNLOAD]: async (e) => {
        const actor = deferred(10 * 1000)
        caller.emit('beforeunload', Object.assign({ actor }, e))
        await actor.promise
      },

      [LSPMSG_SETTINGS]: async ({ type, payload }) => {
        caller.emit('settings:changed', payload)
      },

      [LSPMSG]: async ({ ns, type, payload }: any) => {
        debug(
          `[host (async) -> *user] ${this._debugTag} ns=${ns} type=${type}`,
          payload,
        )

        if (ns && ns.startsWith('hook')) {
          caller.emit(`${ns}:${type}`, payload)
          return
        }

        caller.emit(type, payload)
      },

      [LSPMSG_SYNC]: ({ _sync, result }: any) => {
        debug(`[sync host -> *user] #${_sync}`, result)

        if (syncActors.has(_sync)) {
          const actor = syncActors.get(_sync)

          if (actor) {
            if (result?.hasOwnProperty(LSPMSG_ERROR_TAG)) {
              actor.reject(result[LSPMSG_ERROR_TAG])
            } else {
              actor.resolve(result)
            }

            syncActors.delete(_sync)
          }
        }
      },

      ...userModel,
    })

    if (isShadowMode) {
      await readyDeferred.promise
      return JSON.parse(JSON.stringify(this._pluginLocal?.toJSON()))
    }

    const pm = new Model(model)
    const handshake = pm.sendHandshakeReply()

    this._status = 'pending'

    await handshake
      .then((childRefParent: ChildAPI) => {
        this._child = childRefParent
        this._connected = true

        this._call = async (type, payload = {}, actor) => {
          if (actor) {
            const tag = ++syncTag
            syncActors.set(tag, actor)
            payload._sync = tag

            actor.setTag(`async call #${tag}`)
            debug(`async call #${tag}`)
          }

          childRefParent.emit(LSPMSGFn(model.baseInfo.id), { type, payload })

          return actor?.promise as Promise<any>
        }

        this._callUserModel = async (type, payload) => {
          try {
            model[type](payload)
          } catch (e) {
            debug(`call user model(${type}) not exist. #${this._debugTag}`)
          }
        }

        // actors GC
        this._syncGCTimer = setInterval(() => {
          if (syncActors.size > 100) {
            for (const [k, v] of syncActors) {
              if (v.settled) {
                syncActors.delete(k)
              }
            }
          }
        }, 1000 * 60 * 30)
      })
      .finally(() => {
        this._status = undefined
      })

    await readyDeferred.promise

    return model.baseInfo
  }

  async call(type: any, payload: any = {}) {
    return this._call?.call(this, type, payload)
  }

  // only for callable apis for sdk user
  async callAsync(type: any, payload: any = {}) {
    const actor = deferred(1000 * 10)
    return this._call?.call(this, type, payload, actor)
  }

  async callUserModel(type: string, ...args: any[]) {
    return this._callUserModel?.apply(this, [type, ...args])
  }

  async callUserModelAsync(type: string, ...args: any[]) {
    type = AWAIT_LSPMSGFn(type)
    return this._callUserModel?.apply(this, [type, ...args])
  }

  /**
   * Converts a raw pixel position to a percentage or pixel CSS value,
   * clamping the value to [minValue, MAX_LAYOUT_PERCENT%].
   */
  private _calcLayoutPosition(
    value: number,
    viewportSize: number | undefined,
    minValue: number = 0,
  ): string {
    const clamped = Math.max(value, minValue)
    if (typeof viewportSize === 'number') {
      return `${Math.min((clamped * 100) / viewportSize, MAX_LAYOUT_PERCENT)}%`
    }
    return `${clamped}px`
  }

  /**
   * Restores persisted layout data onto the container element.
   */
  private async _applyContainerLayout(cnt: HTMLDivElement): Promise<void> {
    const mainLayoutInfo = (await this._pluginLocal?._loadLayoutsData())?.$$0
    if (!mainLayoutInfo) return

    const { width, height, left, top, vw, vh } = mainLayoutInfo

    cnt.dataset.inited_layout = 'true'
    Object.assign(cnt.style, {
      width: `${width}px`,
      height: `${height}px`,
      left: this._calcLayoutPosition(left, vw),
      top: this._calcLayoutPosition(top, vh, HEAD_BAR_HEIGHT),
    })
  }

  // run in host
  async _setupIframeSandbox() {
    const pl = this._pluginLocal!
    const id = pl.id
    const domId = `${id}_lsp_main`
    const url = new URL(pl.options.entry!)

    url.searchParams.set(
      `__v__`,
      IS_DEV ? Date.now().toString() : pl.options.version,
    )

    // clear zombie sandbox
    document.querySelector(`#${domId}`)?.remove()

    const cnt = document.createElement('div')
    cnt.classList.add('lsp-iframe-sandbox-container')
    cnt.id = domId
    cnt.dataset.pid = id

    try {
      await this._applyContainerLayout(cnt)
    } catch (e) {
      console.error('[Restore Layout Error]', e)
    }

    document.body.appendChild(cnt)

    const pt = new Postmate({
      id: id + '_iframe',
      container: cnt,
      url: url.href,
      classListArray: ['lsp-iframe-sandbox'],
      model: { baseInfo: JSON.parse(JSON.stringify(pl.toJSON())) },
      allow: pl.options.allow,
      // for optimized postmate message
      enableMessageChannel: true,
    })

    this._status = 'pending'

    const HANDSHAKE_TIMEOUT = 8_000
    let timer: ReturnType<typeof setTimeout>

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        pt.destroy()
        reject(new Error('handshake Timeout'))
      }, HANDSHAKE_TIMEOUT)
    })

    try {
      const parentRefChild = await Promise.race([
        pt.sendHandshake(),
        timeout,
      ]) as ParentAPI

      this._parent = parentRefChild
      this._connected = true
      this.emit('connected')

      parentRefChild.on(LSPMSGFn(pl.id), ({ type, payload }: any) => {
        debug(`[user -> *host] `, type, payload)

        this._pluginLocal?.emit(type, payload || {})
        this._pluginLocal?.caller.emit(type, payload || {})
      })

      this._call = async (...args: any) => {
        // parent all will get message before handshake
        parentRefChild.call(LSPMSGFn(pl.id), {
          type: args[0],
          payload: Object.assign(args[1] || {}, {
            $$pid: pl.id,
          }),
        })
      }

      this._callUserModel = async (type, ...payloads: any[]) => {
        if (type.startsWith(FLAG_AWAIT)) {
          return await parentRefChild.get(
            type.replace(FLAG_AWAIT, ''),
            ...payloads,
          )
        } else {
          parentRefChild.call(type, payloads?.[0])
        }
      }
    } catch (e) {
      debug('[iframe sandbox] error', e)
      throw e
    } finally {
      clearTimeout(timer!)
      this._status = undefined
    }
  }

  async _setupShadowSandbox() {
    const pl = this._pluginLocal!
    const shadow = (this._shadow = new LSPluginShadowFrame(pl))

    try {
      this._status = 'pending'

      await shadow.load()

      this._connected = true
      this.emit('connected')

      this._call = async (type, payload = {}, actor) => {
        actor && (payload.actor = actor)

        // @ts-ignore Call in same thread
        this._pluginLocal?.emit(
          type,
          Object.assign(payload, {
            $$pid: pl.id,
          }),
        )

        return actor?.promise
      }

      this._callUserModel = async (...args: any) => {
        let type = args[0] as string

        if (type?.startsWith(FLAG_AWAIT)) {
          type = type.replace(FLAG_AWAIT, '')
        }

        const payload = args[1] || {}
        const fn = this._userModel[type]

        if (typeof fn === 'function') {
          await fn.call(null, payload)
        }
      }
    } catch (e) {
      debug('[shadow sandbox] error', e)
      throw e
    } finally {
      this._status = undefined
    }
  }

  _extendUserModel(model: any) {
    return Object.assign(this._userModel, model)
  }

  _getSandboxIframeContainer() {
    return this._parent?.frame.parentNode as HTMLDivElement
  }

  _getSandboxShadowContainer() {
    return this._shadow?.frame.parentNode as HTMLDivElement
  }

  _getSandboxIframeRoot() {
    return this._parent?.frame
  }

  _getSandboxShadowRoot() {
    return this._shadow?.frame
  }

  set debugTag(value: string) {
    this._debugTag = value
  }

  async destroy() {
    let root: HTMLElement = null
    if (this._parent) {
      root = this._getSandboxIframeContainer()
      this._parent.destroy()
    }

    if (this._shadow) {
      root = this._getSandboxShadowContainer()
      this._shadow.destroy()
    }

    root?.parentNode?.removeChild(root)

    // clear GC timer
    if (this._syncGCTimer) {
      clearInterval(this._syncGCTimer)
      this._syncGCTimer = null
    }
  }
}

export {
  LSPluginCaller
}
