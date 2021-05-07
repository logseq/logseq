import Postmate from 'postmate'
import EventEmitter from 'eventemitter3'
import { PluginLocal } from './LSPlugin.core'
import Debug from 'debug'
import { deferred } from './helpers'
import { LSPluginShadowFrame } from './LSPlugin.shadow'

const debug = Debug('LSPlugin:caller')

type DeferredActor = ReturnType<typeof deferred>

export const LSPMSG = '#lspmsg#'
export const LSPMSG_SETTINGS = '#lspmsg#settings#'
export const LSPMSG_SYNC = '#lspmsg#reply#'
export const LSPMSG_READY = '#lspmsg#ready#'
export const LSPMSGFn = (id: string) => `${LSPMSG}${id}`

/**
 * Call between core and user
 */
class LSPluginCaller extends EventEmitter {
  private _connected: boolean = false

  private _parent?: Postmate.ParentAPI
  private _child?: Postmate.ChildAPI

  private _shadow?: LSPluginShadowFrame

  private _status?: 'pending' | 'timeout'
  private _userModel: any = {}

  private _call?: (type: string, payload: any, actor?: DeferredActor) => Promise<any>
  private _callUserModel?: (type: string, payload: any) => Promise<any>

  constructor (
    private _pluginLocal: PluginLocal | null
  ) {
    super()
  }

  async connectToChild () {
    if (this._connected) return

    const { shadow } = this._pluginLocal!

    if (shadow) {
      await this._setupShadowSandbox()
    } else {
      await this._setupIframeSandbox()
    }
  }

  async connectToParent (userModel = {}) {
    if (this._connected) return

    const caller = this
    const isShadowMode = this._pluginLocal != null

    let syncGCTimer: any = 0
    let syncTag = 0
    const syncActors = new Map<number, DeferredActor>()
    const readyDeferred = deferred()

    const model: any = this._extendUserModel({
      [LSPMSG_READY]: async () => {
        await readyDeferred.resolve()
      },

      [LSPMSG_SETTINGS]: async ({ type, payload }) => {
        caller.emit('settings:changed', payload)
      },

      [LSPMSG]: async ({ ns, type, payload }: any) => {
        debug(`[call from host #${this._pluginLocal?.id}]`, ns, type, payload)

        if (ns && ns.startsWith('hook')) {
          caller.emit(`${ns}:${type}`, payload)
          return
        }

        caller.emit(type, payload)
      },

      [LSPMSG_SYNC]: ({ _sync, result }: any) => {
        debug(`sync reply #${_sync}`, result)
        if (syncActors.has(_sync)) {
          // TODO: handle exception
          syncActors.get(_sync)?.resolve(result)
          syncActors.delete(_sync)
        }
      },

      ...userModel
    })

    if (isShadowMode) {
      await readyDeferred.promise
      return JSON.parse(JSON.stringify(this._pluginLocal?.toJSON()))
    }

    const handshake = new Postmate.Model(model)

    this._status = 'pending'

    await handshake.then(refParent => {
      this._child = refParent
      this._connected = true

      this._call = async (type, payload = {}, actor) => {
        if (actor) {
          const tag = ++syncTag
          syncActors.set(tag, actor)
          payload._sync = tag

          actor.setTag(`async call #${tag}`)
          debug('async call #', tag)
        }

        refParent.emit(LSPMSGFn(model.baseInfo.id), { type, payload })

        return actor?.promise as Promise<any>
      }

      this._callUserModel = async (type, payload) => {
        try {
          model[type](payload)
        } catch (e) {
          debug(`model method #${type} not existed`)
        }
      }

      // actors GC
      syncGCTimer = setInterval(() => {
        if (syncActors.size > 100) {
          for (const [k, v] of syncActors) {
            if (v.settled) {
              syncActors.delete(k)
            }
          }
        }
      }, 1000 * 60 * 30)
    }).finally(() => {
      this._status = undefined
    })

    // TODO: timeout
    await readyDeferred.promise

    return model.baseInfo
  }

  async call (type: any, payload: any = {}) {
    // TODO: ?
    this.emit(type, payload)
    return this._call?.call(this, type, payload)
  }

  async callAsync (type: any, payload: any = {}) {
    const actor = deferred(1000 * 10)
    return this._call?.call(this, type, payload, actor)
  }

  async callUserModel (type: string, payload: any = {}) {
    return this._callUserModel?.call(this, type, payload)
  }

  async _setupIframeSandbox () {
    const pl = this._pluginLocal!

    const handshake = new Postmate({
      container: document.body,
      url: pl.options.entry!,
      classListArray: ['lsp-iframe-sandbox'],
      model: { baseInfo: JSON.parse(JSON.stringify(pl.toJSON())) }
    })

    this._status = 'pending'

    // timeout for handshake
    let timer

    return new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`handshake Timeout`))
      }, 3 * 1000) // 3secs

      handshake.then(refChild => {
        this._parent = refChild
        this._connected = true
        this.emit('connected')

        refChild.frame.setAttribute('id', pl.id)
        refChild.on(LSPMSGFn(pl.id), ({ type, payload }: any) => {
          debug(`[call from plugin] `, type, payload)

          this._pluginLocal?.emit(type, payload || {})
        })

        this._call = async (...args: any) => {
          // parent all will get message
          await refChild.call(LSPMSGFn(pl.id), { type: args[0], payload: args[1] || {} })
        }

        this._callUserModel = async (...args: any) => {
          await refChild.call(args[0], args[1] || {})
        }

        resolve(null)
      }).catch(e => {
        reject(e)
      }).finally(() => {
        clearTimeout(timer)
      })
    }).catch(e => {
      debug('iframe sandbox error', e)
      throw e
    }).finally(() => {
      this._status = undefined
    })
  }

  async _setupShadowSandbox () {
    const pl = this._pluginLocal!
    const shadow = this._shadow = new LSPluginShadowFrame(pl)

    try {
      this._status = 'pending'

      await shadow.load()

      this._connected = true
      this.emit('connected')

      this._call = async (type, payload = {}, actor) => {
        actor && (payload.actor = actor)

        // TODO: support sync call
        // @ts-ignore Call in same thread
        this._pluginLocal?.emit(type, payload)

        return actor?.promise
      }

      this._callUserModel = async (...args: any) => {
        const type = args[0]
        const payload = args[1] || {}
        const fn = this._userModel[type]

        if (typeof fn === 'function') {
          await fn.call(null, payload)
        }
      }
    } catch (e) {
      debug('shadow sandbox error', e)
      throw e
    } finally {
      this._status = undefined
    }
  }

  _extendUserModel (model: any) {
    return Object.assign(this._userModel, model)
  }

  _getSandboxIframeContainer () {
    return this._parent?.frame
  }

  _getSandboxShadowContainer () {
    return this._shadow?.frame
  }

  async destroy () {
    if (this._parent) {
      await this._parent.destroy()
    }

    if (this._shadow) {
      this._shadow.destroy()
    }
  }
}

export {
  LSPluginCaller
}
