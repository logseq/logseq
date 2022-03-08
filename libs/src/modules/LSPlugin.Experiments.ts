import { LSPluginUser } from '../LSPlugin.user'
import { snakeCase } from 'lodash-es'
import { PluginLocal } from '../LSPlugin.core'

/**
 * Some experiment features
 */
export class LSPluginExperiments {
  constructor (
    private ctx: LSPluginUser
  ) {}

  get React (): unknown {
    return this.ensureHostScope().React
  }

  get ReactDOM (): unknown {
    return this.ensureHostScope().ReactDOM
  }

  get pluginLocal (): PluginLocal {
    return this.ensureHostScope().LSPluginCore.ensurePlugin(this.ctx.baseInfo.id)
  }

  private invokeExperMethod (type: string, ...args: Array<any>) {
    const host = this.ensureHostScope()
    type = snakeCase(type)?.toLowerCase()
    return host.logseq.api['exper_' + type]?.apply(host, args)
  }

  async loadScripts (...scripts: Array<string>) {
    scripts = scripts.map(it => {
      if (!it?.startsWith('http')) {
        return this.ctx.resolveResourceFullUrl(it)
      }

      return it
    })

    scripts.unshift(this.ctx.baseInfo.id)
    await this.invokeExperMethod('loadScripts', ...scripts)
  }

  registerFencedCodeRenderer (
    type: string,
    opts: {
      edit?: boolean,
      before?: () => Promise<void>,
      subs?: Array<string>,
      render: (props: { content: string }) => any,
    }) {
    return this.ensureHostScope().logseq.api.exper_register_fenced_code_renderer(
      this.ctx.baseInfo.id, type, opts
    )
  }

  ensureHostScope (): any {
    if (window === top) {
      throw new Error('Can not access host scope!')
    }

    return top
  }
}


