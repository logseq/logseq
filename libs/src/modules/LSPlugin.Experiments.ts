import { LSPluginUser } from '../LSPlugin.user'
import { PluginLocal } from '../LSPlugin.core'
import { safeSnakeCase } from '../helpers'

/**
 * WARN: These are some experience features and may be adjusted at any time.
 * These unofficial plugins that use these APIs are temporarily
 * not supported on the Marketplace.
 */
export class LSPluginExperiments {
  constructor(private ctx: LSPluginUser) {}

  get React(): unknown {
    return this.ensureHostScope().React
  }

  get ReactDOM(): unknown {
    return this.ensureHostScope().ReactDOM
  }

  get pluginLocal(): PluginLocal {
    return this.ensureHostScope().LSPluginCore.ensurePlugin(
      this.ctx.baseInfo.id
    )
  }

  public invokeExperMethod(type: string, ...args: Array<any>) {
    const host = this.ensureHostScope()
    type = safeSnakeCase(type)?.toLowerCase()
    return host.logseq.api['exper_' + type]?.apply(host, args)
  }

  async loadScripts(...scripts: Array<string>) {
    scripts = scripts.map((it) => {
      if (!it?.startsWith('http')) {
        return this.ctx.resolveResourceFullUrl(it)
      }

      return it
    })

    scripts.unshift(this.ctx.baseInfo.id)
    await this.invokeExperMethod('loadScripts', ...scripts)
  }

  registerFencedCodeRenderer(
    type: string,
    opts: {
      edit?: boolean
      before?: () => Promise<void>
      subs?: Array<string>
      render: (props: { content: string }) => any
    }
  ) {
    return this.ensureHostScope().logseq.api.exper_register_fenced_code_renderer(
      this.ctx.baseInfo.id,
      type,
      opts
    )
  }

  registerExtensionsEnhancer<T = any>(
    type: 'katex' | 'codemirror',
    enhancer: (v: T) => Promise<any>
  ) {
    const host = this.ensureHostScope()

    switch (type) {
      case 'katex':
        if (host.katex) {
          enhancer(host.katex).catch(console.error)
        }
        break
      default:
    }

    return host.logseq.api.exper_register_extensions_enhancer(
      this.ctx.baseInfo.id,
      type,
      enhancer
    )
  }

  ensureHostScope(): any {
    if (window === top) {
      throw new Error('Can not access host scope!')
    }

    return top
  }
}
