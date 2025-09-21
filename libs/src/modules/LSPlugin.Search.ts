import { IPluginSearchServiceHooks } from '../LSPlugin'
import { LSPluginUser } from '../LSPlugin.user'
import { isArray, isFunction, mapKeys } from 'lodash-es'

export class LSPluginSearchService {
  /**
   * @param ctx
   * @param serviceHooks
   */
  constructor(
    private ctx: LSPluginUser,
    private serviceHooks: IPluginSearchServiceHooks
  ) {
    ctx._execCallableAPI(
      'register-search-service',
      ctx.baseInfo.id,
      serviceHooks.name,
      serviceHooks.options
    )

    // hook events TODO: remove listeners
    const wrapHookEvent = (k) => `service:search:${k}:${serviceHooks.name}`

    Object.entries({
      query: {
        f: 'onQuery',
        args: ['graph', 'q', true],
        reply: true,
        transformOutput: (data: any) => {
          // TODO: transform keys?
          if (isArray(data?.blocks)) {
            data.blocks = data.blocks.map((it) => {
              return it && mapKeys(it, (_, k) => `block/${k}`)
            })
          }

          return data
        },
      },
      rebuildBlocksIndice: { f: 'onIndiceInit', args: ['graph', 'blocks'] },
      transactBlocks: { f: 'onBlocksChanged', args: ['graph', 'data'] },
      truncateBlocks: { f: 'onIndiceReset', args: ['graph'] },
      removeDb: { f: 'onGraph', args: ['graph'] },
    }).forEach(([k, v]) => {
      const hookEvent = wrapHookEvent(k)
      ctx.caller.on(hookEvent, async (payload: any) => {
        if (isFunction(serviceHooks?.[v.f])) {
          let ret = null

          try {
            ret = await serviceHooks[v.f].apply(
              serviceHooks,
              (v.args || []).map((prop: any) => {
                if (!payload) return
                if (prop === true) return payload
                if (payload.hasOwnProperty(prop)) {
                  const ret = payload[prop]
                  delete payload[prop]
                  return ret
                }
              })
            )

            if (v.transformOutput) {
              ret = v.transformOutput(ret)
            }
          } catch (e) {
            console.error('[SearchService] ', e)
            ret = e
          } finally {
            if (v.reply) {
              ctx.caller.call(`${hookEvent}:reply`, ret)
            }
          }
        }
      })
    })
  }
}
