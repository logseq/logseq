import EventEmitter from 'eventemitter3'
import { PluginLocal } from './LSPlugin.core'
import { LSPluginUser } from './LSPlugin.user'

// @ts-ignore
const { importHTML, createSandboxContainer } = window.QSandbox || {}

function userFetch(url, opts) {
  if (!url.startsWith('http')) {
    url = url.replace('file://', '')
    return new Promise(async (resolve, reject) => {
      try {
        const content = await window.apis.doAction(['readFile', url])
        resolve({
          text() {
            return content
          },
        })
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }

  return fetch(url, opts)
}

class LSPluginShadowFrame extends EventEmitter<'mounted' | 'unmounted'> {
  private _frame?: HTMLElement
  private _root?: ShadowRoot
  private _loaded = false
  private _unmountFns: Array<() => Promise<void>> = []

  constructor(private _pluginLocal: PluginLocal) {
    super()

    _pluginLocal._dispose(() => {
      this._unmount()
    })
  }

  async load() {
    const { name, entry } = this._pluginLocal.options

    if (this.loaded || !entry) return

    const { template, execScripts } = await importHTML(entry, {
      fetch: userFetch,
    })

    this._mount(template, document.body)

    const sandbox = createSandboxContainer(name, {
      elementGetter: () => this._root?.firstChild,
    })

    const global = sandbox.instance.proxy as any

    global.__shadow_mode__ = true
    global.LSPluginLocal = this._pluginLocal
    global.LSPluginShadow = this
    global.LSPluginUser = global.logseq = new LSPluginUser(
      this._pluginLocal.toJSON() as any,
      this._pluginLocal.caller!
    )

    // TODO: {mount, unmount}
    const execResult: any = await execScripts(global, true)

    this._unmountFns.push(execResult.unmount)

    this._loaded = true
  }

  _mount(content: string, container: HTMLElement) {
    const frame = (this._frame = document.createElement('div'))
    frame.classList.add('lsp-shadow-sandbox')
    frame.id = this._pluginLocal.id

    this._root = frame.attachShadow({ mode: 'open' })
    this._root.innerHTML = `<div>${content}</div>`

    container.appendChild(frame)

    this.emit('mounted')
  }

  _unmount() {
    for (const fn of this._unmountFns) {
      fn && fn.call(null)
    }
  }

  destroy() {
    this.frame?.parentNode?.removeChild(this.frame)
  }

  get loaded(): boolean {
    return this._loaded
  }

  get document() {
    return this._root?.firstChild as HTMLElement
  }

  get frame(): HTMLElement {
    return this._frame!
  }
}

export { LSPluginShadowFrame }
