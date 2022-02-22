import { LSPluginUser } from '../LSPlugin.user'
import { snakeCase } from 'lodash-es'

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

  private invokeExperMethod (type: string, ...args: Array<any>) {
    type = snakeCase(type)?.toLowerCase()
    // @ts-ignore
    return top.logseq.api['exper_' + type]?.apply(top, args)
  }

  async loadScripts (...scripts: Array<string>) {
    scripts.unshift(this.ctx.baseInfo.id)
    await this.invokeExperMethod('loadScripts', ...scripts)
  }

  async sayHello () {
    const k = await this.ctx.UI.showMsg('hello experiments')
    console.log('==>', k, this.React, this.ReactDOM)
  }
}