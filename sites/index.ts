import cookie from 'cookie'

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;

  ENVIRONMENT: string
}

declare const ENVIRONMENT: string

export default {
  async fetch (
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { ENVIRONMENT } = env
    const isProd = ENVIRONMENT === 'production'
    const urlObj = new URL(request.url)
    const cookieObj = cookie.parse(request.headers.get('Cookie') || '')
    const justGoToApp = cookieObj && cookieObj[`spa`] == '1'

    console.log('D:', urlObj.pathname)
    console.log('D:', JSON.stringify(env))

    const landingEntryPoint = isProd ? `https://ls-site.pages.dev` :
      `http://127.0.0.1:1234`
    const appEntryPoint = `https://logseq.com/?spa=true`
    const appAssetsPoint = `https://logseq.com`

    if (['/', '/index.html'].includes(urlObj.pathname)) {
      const entryHtml = await (await fetch(
        justGoToApp ? appEntryPoint : landingEntryPoint
      )).text()
      return new Response(entryHtml, {
        headers: {
          'content-type': 'text/html;charset=UTF-8'
        }
      })
    }

    const forceAppEndpoint = [
      `/js/worker.js`,
      `/js/magic_portal.js`,
      `/js/lightning-fs.min.js`
    ].some(it => {
      return urlObj.pathname?.startsWith(it)
    })

    // TODO: just return object
    return fetch(`${forceAppEndpoint ? appAssetsPoint : landingEntryPoint}${urlObj.pathname}`)
  },
}
