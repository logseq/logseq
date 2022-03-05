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
    // @ts-ignore
    return top.React
  }

  get ReactDOM (): unknown {
    // @ts-ignore
    return top.ReactDOM
  }

  get pluginLocal (): PluginLocal {
    return top.LSPluginCore.ensurePlugin(this.ctx.baseInfo.id)
  }

  private invokeExperMethod (type: string, ...args: Array<any>) {
    type = snakeCase(type)?.toLowerCase()
    // @ts-ignore
    return top.logseq.api['exper_' + type]?.apply(top, args)
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
    // @ts-ignore
    return top.logseq.api.exper_register_fenced_code_renderer(
      this.ctx.baseInfo.id, type, opts
    )
  }
}