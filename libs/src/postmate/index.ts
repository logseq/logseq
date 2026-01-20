// Fork from https://github.com/dollarshaveclub/postmate

export const messageType = 'application/x-postmate-v1+json'
export const defaultRequestTimeout = 10_000
export const maxHandshakeRequests = 5

let _messageId = 0

const generateNewMessageId = () => ++_messageId
const log = (...args: any) => (Postmate.debug ? console.log(...args) : null)
const resolveOrigin = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  const protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol
  const host = a.host.length
    ? a.port === '80' || a.port === '443'
      ? a.hostname
      : a.host
    : window.location.host
  return a.origin || `${protocol}//${host}`
}

const messageTypes = {
  handshake: 1,
  'handshake-reply': 1,
  call: 1,
  emit: 1,
  reply: 1,
  request: 1,
}

export const sanitize = (message: any, allowedOrigin: any) => {
  if (typeof allowedOrigin === 'string' && message.origin !== allowedOrigin)
    return false
  if (!message.data) return false
  if (typeof message.data === 'object' && !('postmate' in message.data))
    return false
  if (message.data.type !== messageType) return false
  if (!messageTypes[message.data.postmate]) return false
  return true
}

export const resolveValue = (model: any, property: string, args: Array<any>) => {
  // args arguments passed from parent to child function
  const unwrappedContext =
    typeof model[property] === 'function'
      ? model[property].apply(null, args)
      : model[property]
  return Promise.resolve(unwrappedContext)
}

/**
 * Composes an API to be used by the parent
 * @param {Object} info Information on the consumer
 */
export class ParentAPI {
  public parent: Window
  public frame: HTMLIFrameElement
  public child: Window
  public events = {}
  public childOrigin: string
  public listener: (e: any) => void
  private readonly messagePort?: MessagePort

  private addTransportListener(handler: (e: any) => void) {
    if (this.messagePort) {
      // MessagePort delivers MessageEvent too, but without origin/source.
      this.messagePort.addEventListener('message', handler as any)
      // Some browsers require start() when using addEventListener.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      ;(this.messagePort as any).start?.()
    } else {
      this.parent.addEventListener('message', handler, false)
    }
  }

  private removeTransportListener(handler: (e: any) => void) {
    if (this.messagePort) {
      this.messagePort.removeEventListener('message', handler as any)
    } else {
      this.parent.removeEventListener('message', handler, false)
    }
  }

  private postToChild(payload: any) {
    if (this.messagePort) {
      this.messagePort.postMessage(payload)
      return
    }
    this.child.postMessage(payload, this.childOrigin)
  }

  constructor(info: Postmate) {
    this.parent = info.parent
    this.frame = info.frame
    this.child = info.child
    this.childOrigin = info.childOrigin
    this.messagePort = info.messagePort

    if (process.env.NODE_ENV !== 'production') {
      log('Parent: Registering API')
      log('Parent: Awaiting messages...')
    }

    this.listener = (e) => {
      // Port messages don't have origin/source, so we only enforce postmate/type.
      if (this.messagePort) {
        if (!e?.data) return false
        if (typeof e.data === 'object' && !('postmate' in e.data)) return false
        if (e.data.type !== messageType) return false
        if (!messageTypes[e.data.postmate]) return false
      } else {
        if (!sanitize(e, this.childOrigin)) return false
      }

      /**
       * the assignments below ensures that e, data, and value are all defined
       */
      const { data, name } = ((e || {}).data || {}).value || {}

      if (e.data.postmate === 'emit') {
        if (process.env.NODE_ENV !== 'production') {
          log(`Parent: Received event emission: ${name}`)
        }
        if (name in this.events) {
          this.events[name].forEach((callback: Function) => {
            callback.call(this, data)
          })
        }
      }
    }

    this.addTransportListener(this.listener)
    if (process.env.NODE_ENV !== 'production') {
      log('Parent: Awaiting event emissions from Child')
    }
  }

  get(property: string, ...args: any) {
    return new Promise((resolve, reject) => {
      // Extract data from response and kill listeners
      const uid = generateNewMessageId()
      const timeoutMs =
        typeof (Postmate as any).requestTimeout === 'number'
          ? (Postmate as any).requestTimeout
          : defaultRequestTimeout

      let timer: any
      const transact = (e) => {
        if (e?.data?.uid === uid && e.data.postmate === 'reply') {
          this.removeTransportListener(transact)
          if (timer) clearTimeout(timer)
          if (e.data.error) {
            reject(e.data.error)
          } else {
            resolve(e.data.value)
          }
        }
      }

      // Prepare for response from Child...
      this.addTransportListener(transact)

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.removeTransportListener(transact)
          reject(new Error(`Postmate: request timeout (${timeoutMs}ms)`))
        }, timeoutMs)
      }

      // Then ask child for information
      this.postToChild({
        postmate: 'request',
        type: messageType,
        property,
        args,
        uid,
      })
    })
  }

  call(property: string, data: any) {
    // Send information to the child
    this.postToChild({
      postmate: 'call',
      type: messageType,
      property,
      data,
    })
  }

  on(eventName: string, callback: Function) {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(callback)
  }

  destroy() {
    if (process.env.NODE_ENV !== 'production') {
      log('Parent: Destroying Postmate instance')
    }
    this.removeTransportListener(this.listener)
    try {
      this.messagePort?.close()
    } catch (e) {
      // ignore
    }
    this.frame.parentNode.removeChild(this.frame)
  }
}

// Composes an API to be used by the child
export class ChildAPI {
  private readonly model: any
  private parent: Window
  private readonly parentOrigin: string
  private child: Window
  private readonly messagePort?: MessagePort
  private readonly listener: (e: any) => void

  private addTransportListener(handler: (e: any) => void) {
    if (this.messagePort) {
      this.messagePort.addEventListener('message', handler as any)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      ;(this.messagePort as any).start?.()
    } else {
      this.child.addEventListener('message', handler, false)
    }
  }

  private postToParent(payload: any, fallbackEvent?: MessageEvent<any>) {
    if (this.messagePort) {
      this.messagePort.postMessage(payload)
      return
    }
    // reply uses the event source/origin, others use stored parentOrigin.
    if (fallbackEvent?.source) {
      ;(fallbackEvent.source as WindowProxy).postMessage(payload, fallbackEvent.origin)
    } else {
      this.parent.postMessage(payload, this.parentOrigin)
    }
  }

  constructor(info: Model) {
    this.model = info.model
    this.parent = info.parent
    this.parentOrigin = info.parentOrigin
    this.child = info.child
    this.messagePort = info.messagePort

    if (process.env.NODE_ENV !== 'production') {
      log('Child: Registering API')
      log('Child: Awaiting messages...')
    }

    this.listener = (e) => {
      // Port messages don't have origin/source, so we only enforce postmate/type.
      if (this.messagePort) {
        if (!e?.data) return
        if (typeof e.data === 'object' && !('postmate' in e.data)) return
        if (e.data.type !== messageType) return
        if (!messageTypes[e.data.postmate]) return
      } else {
        if (!sanitize(e, this.parentOrigin)) return
      }

      const { property, uid, data, args } = e.data

      if (e.data.postmate === 'call') {
        if (
          property in this.model &&
          typeof this.model[property] === 'function'
        ) {
          this.model[property](data)
        }
        return
      }

      // Reply to Parent
      resolveValue(this.model, property, args)
        .then((value) => {
          this.postToParent(
            {
              property,
              postmate: 'reply',
              type: messageType,
              uid,
              value,
            },
            e
          )
        })
        .catch((error) => {
          this.postToParent(
            {
              property,
              postmate: 'reply',
              type: messageType,
              uid,
              error,
            },
            e
          )
        })
    }

    this.addTransportListener(this.listener)
  }

  emit(name: string, data: any) {
    if (process.env.NODE_ENV !== 'production') {
      log(`Child: Emitting Event "${name}"`, data)
    }
    this.postToParent({
      postmate: 'emit',
      type: messageType,
      value: {
        name,
        data,
      },
    })
  }
}

export type PostMateOptions = {
  container: HTMLElement
  url: string
  id?: string
  classListArray?: Array<string>
  name?: string
  model?: any,
  allow?: string
  /**
   * Prefer using MessageChannel/MessagePort after handshake.
   * Defaults to false to keep backward-compatible behavior with older SDKs.
   */
  enableMessageChannel?: boolean
}

/**
 * The entry point of the Parent.
 */
export class Postmate {
  static debug = false // eslint-disable-line no-undef
  static requestTimeout: number = defaultRequestTimeout
  public container?: HTMLElement
  public parent: Window
  public frame: HTMLIFrameElement
  public child?: Window
  public childOrigin?: string
  public url: string
  public model: any
  static Model: any

  // Preferred transport after handshake.
  public messagePort?: MessagePort
  private readonly enableMessageChannel: boolean

  constructor(opts: PostMateOptions) {
    this.container = opts.container
    this.url = opts.url
    this.parent = window
    this.frame = document.createElement('iframe')
    if (opts.id) this.frame.id = opts.id
    if (opts.name) this.frame.name = opts.name
    if (opts.allow) this.frame.allow = opts.allow
    this.frame.classList.add.apply(
      this.frame.classList,
      opts.classListArray || []
    )
    this.container.appendChild(this.frame)
    this.child = this.frame.contentWindow
    this.model = opts.model || {}
    this.enableMessageChannel = !!opts.enableMessageChannel
  }

  sendHandshake(url?: string) {
    url = url || this.url
    const childOrigin = resolveOrigin(url)
    let attempt = 0
    let responseInterval: any
    return new Promise((resolve, reject) => {
      const runtimeSupportsMessageChannel =
        typeof MessageChannel !== 'undefined' &&
        typeof (MessageChannel as any) === 'function'

      const shouldUseMessageChannel =
        this.enableMessageChannel && runtimeSupportsMessageChannel

      // Prefer MessageChannel if available. We transfer port2 to child.
      // Important: once a port is transferred, it becomes neutered in this context,
      // so we must create a fresh channel per handshake attempt.
      let channel: MessageChannel | null = null
      let port1: MessagePort | undefined
      let port2: MessagePort | undefined

      const ensureChannel = () => {
        if (!shouldUseMessageChannel) return
        // If we already have an active port from previous run, keep it.
        if (this.messagePort) return
        channel = new MessageChannel()
        port1 = channel.port1
        port2 = channel.port2
        this.messagePort = port1
        ;(port1 as any).start?.()
      }

      ensureChannel()

      const reply = (e: any) => {
        if (!sanitize(e, childOrigin)) return false
        if (e.data.postmate === 'handshake-reply') {
          clearInterval(responseInterval)
          if (process.env.NODE_ENV !== 'production') {
            log('Parent: Received handshake reply from Child')
          }
          this.parent.removeEventListener('message', reply, false)
          this.childOrigin = e.origin

          // If child didn't accept/return channel, fallback to window messages.
          // Note: MessageChannel port is already set on this instance.
          // Some browsers deliver the transferred port via e.ports.
          if (e?.ports?.length) {
            // Prefer the port child returned (if any); otherwise keep existing.
            const returnedPort = e.ports[0]
            if (returnedPort) {
              try {
                this.messagePort?.close()
              } catch (err) {
                // ignore
              }
              this.messagePort = returnedPort
              ;(this.messagePort as any).start?.()
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            log('Parent: Saving Child origin', this.childOrigin)
          }
          return resolve(new ParentAPI(this))
        }

        // Might need to remove since parent might be receiving different messages
        // from different hosts
        if (process.env.NODE_ENV !== 'production') {
          log('Parent: Invalid handshake reply')
        }
        return reject('Failed handshake')
      }

      this.parent.addEventListener('message', reply, false)

      const doSend = () => {
        attempt++
        if (process.env.NODE_ENV !== 'production') {
          log(`Parent: Sending handshake attempt ${attempt}`, { childOrigin })
        }
        // port2 can be transferred only once. Create a new channel for retries.
        if (shouldUseMessageChannel) {
          // close any previous un-used port before re-creating.
          if (!this.messagePort || port2 === undefined) {
            // nothing
          }
          if (!port2) {
            // We already transferred it in a previous attempt; create a fresh pair.
            try {
              this.messagePort?.close()
            } catch (e) {
              // ignore
            }
            this.messagePort = undefined
            ensureChannel()
          }
        }

        const payload: any = {
          postmate: 'handshake',
          type: messageType,
          model: this.model,
          // hint for debugging / future extension
          channel: port2 ? 1 : 0,
          enableMessageChannel: shouldUseMessageChannel ? 1 : 0,
        }

        if (port2) {
          this.child.postMessage(payload, childOrigin, [port2])
          // Mark as transferred; next retry needs a new channel.
          port2 = undefined
        } else {
          this.child.postMessage(payload, childOrigin)
        }

        if (attempt === maxHandshakeRequests) {
          clearInterval(responseInterval)
        }
      }

      const loaded = () => {
        doSend()
        responseInterval = setInterval(doSend, 500)
      }

      this.frame.addEventListener('load', loaded)

      if (process.env.NODE_ENV !== 'production') {
        log('Parent: Loading frame', { url })
      }
      this.frame.src = url
    })
  }

  destroy() {
    if (process.env.NODE_ENV !== 'production') {
      log('Postmate: Destroying Postmate instance')
    }
    try {
      this.messagePort?.close()
    } catch (e) {
      // ignore
    }
    this.frame.parentNode.removeChild(this.frame)
  }
}

/**
 * The entry point of the Child
 */
export class Model {
  public child: Window
  public model: any
  public parent: Window
  public parentOrigin: string
  public messagePort?: MessagePort
  private enableMessageChannel: boolean

  constructor(model: any) {
    this.child = window
    this.model = model
    this.parent = this.child.parent
    // Child side is controlled by what parent sends in handshake; default false.
    this.enableMessageChannel = false
  }

  sendHandshakeReply() {
    return new Promise((resolve, reject) => {
      const shake = (e: MessageEvent<any>) => {
        if (!e.data.postmate) {
          return
        }
        if (e.data.postmate === 'handshake') {
          if (process.env.NODE_ENV !== 'production') {
            log('Child: Received handshake from Parent')
          }
          this.child.removeEventListener('message', shake, false)

          // Only enable MessagePort transport when parent explicitly opted-in AND actually transferred a port.
          this.enableMessageChannel = !!e.data?.enableMessageChannel
          const transferredPort = e?.ports?.[0]
          if (this.enableMessageChannel && transferredPort) {
            this.messagePort = transferredPort
            ;(this.messagePort as any).start?.()
          } else {
            this.messagePort = undefined
          }

          if (process.env.NODE_ENV !== 'production') {
            log('Child: Sending handshake reply to Parent')
          }
          // Reply back. If we want a dedicated child->parent port, we can
          // create one and transfer it. For now, we only ack and rely on the
          // transferred port (if any). Keep window reply for compatibility.
          ;(e.source as WindowProxy).postMessage(
            {
              postmate: 'handshake-reply',
              type: messageType,
            },
            e.origin
          )
          this.parentOrigin = e.origin

          // Extend model with the one provided by the parent
          const defaults = e.data.model
          if (defaults) {
            Object.keys(defaults).forEach((key) => {
              this.model[key] = defaults[key]
            })
            if (process.env.NODE_ENV !== 'production') {
              log('Child: Inherited and extended model from Parent')
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            log('Child: Saving Parent origin', this.parentOrigin)
          }
          return resolve(new ChildAPI(this))
        }
        return reject('Handshake Reply Failed')
      }
      this.child.addEventListener('message', shake, false)
    })
  }
}
