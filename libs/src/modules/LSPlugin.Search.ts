import { IPluginSearchServiceHooks } from '../LSPlugin'
import { LSPluginUser } from '../LSPlugin.user'

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

    Object.entries(
      {
        query: { f: 'onQuery', args: ['graph', 'q', true] },
        rebuildBlocksIndice: { f: 'onIndiceInit', args: ['graph', 'blocks'] }
      }
    ).forEach(
      ([k, v]) => {
        ctx.caller.on(wrapHookEvent(k), async (payload: any) => {
          if (serviceHooks?.[v.f]) {
            await serviceHooks[v.f].apply(
              serviceHooks, (v.args || []).map((prop: any) => {
                if (!payload) return
                if (prop === true) return payload
                if (payload.hasOwnProperty(prop)) {
                  const ret = payload[prop]
                  delete payload[prop]
                  return ret
                }
              })
            )
          }
        })
      })
  }
}