import { LSPluginUser } from '../LSPlugin.user'
import { PluginLocal } from '../LSPlugin.core'
import { safeSnakeCase } from '../helpers'

/**
 * WARN: These are some experience features and might be adjusted at any time.
 * These unofficial plugins that use these APIs are temporarily
 * may not be supported on the Marketplace.
 */
export class LSPluginExperiments {
  constructor(private ctx: LSPluginUser) {}

  get React(): unknown {
    return this.ensureHostScope().React
  }

  get ReactDOM(): unknown {
    return this.ensureHostScope().ReactDOM
  }

  get Components() {
    const exper = this.ensureHostScope().logseq.sdk.experiments
    return {
      Editor: exper.cp_page_editor as (props: { page: string } & any) => any
    }
  }

  get pluginLocal(): PluginLocal {
    return this.ensureHostScope().LSPluginCore.ensurePlugin(
      this.ctx.baseInfo.id
    )
  }

  public invokeExperMethod(type: string, ...args: Array<any>) {
    const host = this.ensureHostScope()
    type = safeSnakeCase(type)?.toLowerCase()
    const fn = host.logseq.api['exper_' + type] || host.logseq.sdk.experiments[type]
    return fn?.apply(host, args)
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
    lang: string,
    opts: {
      edit?: boolean
      before?: () => Promise<void>
      subs?: Array<string>
      render: (props: { content: string }) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerFencedCodeRenderer',
      this.ctx.baseInfo.id,
      lang,
      opts
    )
  }

  registerDaemonRenderer(
    key: string,
    opts: {
      sub?: Array<string>,
      render: (props: {}) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerDaemonRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  registerRouteRenderer(
    key: string,
    opts: {
      name?: string,
      subs?: Array<string>
      path: string,
      render: (props: {}) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerRouteRenderer',
      this.ctx.baseInfo.id,
      key,
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

    return this.invokeExperMethod(
      'registerExtensionsEnhancer',
      this.ctx.baseInfo.id,
      type,
      enhancer
    )
  }

  ensureHostScope(): any {
    if (window === top) {
      console.error('Can not access host scope!')
      return {}
    }

    return top
  }
}
