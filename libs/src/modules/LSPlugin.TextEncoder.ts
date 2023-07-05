import { IPluginTextEncoderServiceHooks } from '../LSPlugin'
import { LSPluginUser } from '../LSPlugin.user'
import { isFunction } from 'lodash-es'

export class LSPluginTextEncoderService {

  /**
   * @param ctx
   * @param serviceHooks
   */
  constructor(
    private ctx: LSPluginUser,
    private serviceHooks: IPluginTextEncoderServiceHooks
  ) {
    ctx._execCallableAPI(
      'register-TextEncoder-service',
      ctx.baseInfo.id,
      serviceHooks.name,
      serviceHooks.options
    )

    // hook events TODO: remove listeners
    const wrapHookEvent = (k) => `service:textEncoder:${k}:${serviceHooks.name}`

    Object.entries(
      {
        textEncode: {f: 'textEncode', args: ['text'], reply: true}
      }
    ).forEach(
      ([k, v]) => {
        const hookEvent = wrapHookEvent(k)
        ctx.caller.on(hookEvent, async (payload: any) => {
          if (isFunction(serviceHooks?.[v.f])) {
            let ret = null

            try {
              ret = await serviceHooks[v.f].apply(
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
            } catch (e) {
              console.error('[TextEncoderService] ', e)
              ret = e
            } finally {
              if (v.reply) {
                ctx.caller.call(
                  `${hookEvent}:reply`, ret
                )
              }
            }
          }
        })
      })
  }
}