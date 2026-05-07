import { LSPluginUser } from '../LSPlugin.user'

export type NetMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

export type NetResponseType =
  | 'json'
  | 'text'
  | 'base64'
  | 'arraybuffer'
  | 'arrayBuffer'

export type NetHeaders = Record<string, string>

export type NetRetryOptions = {
  retries?: number
  delay?: number
  factor?: number
  retryOn?:
    | Array<number>
    | ((response: LSPluginNetResponse<any> | Error) => boolean)
}

export type NetCacheOptions = {
  key?: string
  ttl?: number
  maxEntries?: number
}

export type NetRequestOptions<TBody = any> = {
  url: string
  method?: NetMethod
  headers?: NetHeaders
  body?: TBody | string | ArrayBuffer
  data?: TBody | string | ArrayBuffer
  responseType?: NetResponseType
  timeout?: number
  retry?: number | NetRetryOptions
  cache?: boolean | NetCacheOptions
  signal?: AbortSignal
  abortable?: boolean
}

export type NetRequestConfig<TBody = any> = Omit<
  NetRequestOptions<TBody>,
  'url' | 'method'
>

export type NetRequestBody<TBody = any> = TBody | string | ArrayBuffer

export type NetResponsePayload<T = any> = {
  status: number
  statusText: string
  ok: boolean
  url: string
  headers: NetHeaders
  body: T
}

type NormalizedRetryOptions = Required<
  Pick<NetRetryOptions, 'retries' | 'delay' | 'factor'>
> &
  Pick<NetRetryOptions, 'retryOn'>

type CacheEntry<T = any> = {
  expires: number
  response: LSPluginNetResponse<T>
}

type HostResponseType = 'json' | 'text' | 'base64' | 'arraybuffer'

type HostRequestID = string | number

const DEFAULT_CACHE_TTL = 5 * 60 * 1000
const DEFAULT_CACHE_MAX_ENTRIES = 100
const CLIENT_MSG_CALLBACK = '#lsp#request#callback'
const genTaskCallbackType = (id: HostRequestID) => `task_callback_${id}`

function normalizeResponseType(type?: NetResponseType): HostResponseType {
  return type === 'arrayBuffer' ? 'arraybuffer' : type || 'json'
}

function makeAbortError() {
  const error = new Error('The request was aborted')
  error.name = 'AbortError'
  return error
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function responseToCachePayload<T>(
  response: LSPluginNetResponse<T>
): NetResponsePayload<T> {
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url,
    headers: { ...response.headers },
    body: response.body,
  }
}

function encodeText(value: string) {
  return new TextEncoder().encode(value).buffer
}

function decodeText(value: ArrayBuffer) {
  return new TextDecoder().decode(value)
}

function base64ToArrayBuffer(value: string) {
  const binary = atob(value)
  const payload = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    payload[i] = binary.charCodeAt(i)
  }

  return payload.buffer
}

function arrayBufferToBase64(value: ArrayBuffer) {
  const payload = new Uint8Array(value)
  const chunkSize = 0x8000
  let binary = ''

  for (let i = 0; i < payload.length; i += chunkSize) {
    binary += String.fromCharCode(...payload.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

function headersToRecord(headers: Headers) {
  const result: NetHeaders = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function bodyToFetchBody(value: unknown): BodyInit | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (value instanceof ArrayBuffer) return value
  if (ArrayBuffer.isView(value)) return value as BodyInit
  return JSON.stringify(value)
}

export class LSPluginNetResponse<T = any> {
  constructor(
    private _payload: NetResponsePayload<T>,
    private _responseType: HostResponseType
  ) {}

  get status() {
    return this._payload.status
  }

  get statusText() {
    return this._payload.statusText
  }

  get ok() {
    return this._payload.ok
  }

  get url() {
    return this._payload.url
  }

  get headers() {
    return this._payload.headers
  }

  get body() {
    return this._payload.body
  }

  async json<R = any>(): Promise<R> {
    const { body } = this._payload

    if (this._responseType === 'json') {
      return body as unknown as R
    }

    if (typeof body === 'string') {
      return JSON.parse(body) as R
    }

    if (body instanceof ArrayBuffer) {
      return JSON.parse(decodeText(body)) as R
    }

    return body as unknown as R
  }

  async text(): Promise<string> {
    const { body } = this._payload

    if (typeof body === 'string') {
      return body
    }

    if (body instanceof ArrayBuffer) {
      return decodeText(body)
    }

    return JSON.stringify(body)
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const { body } = this._payload

    if (body instanceof ArrayBuffer) {
      return body
    }

    if (this._responseType === 'base64' && typeof body === 'string') {
      return base64ToArrayBuffer(body)
    }

    if (typeof body === 'string') {
      return encodeText(body)
    }

    return encodeText(JSON.stringify(body))
  }

  clone(): LSPluginNetResponse<T> {
    return new LSPluginNetResponse(
      responseToCachePayload(this),
      this._responseType
    )
  }
}

export class LSPluginNetError<T = any> extends Error {
  constructor(public response: LSPluginNetResponse<T>) {
    super(
      `HTTP request failed with status ${response.status} ${response.statusText}`.trim()
    )
    this.name = 'LSPluginNetError'
  }

  get status() {
    return this.response.status
  }

  get statusText() {
    return this.response.statusText
  }

  get url() {
    return this.response.url
  }

  get headers() {
    return this.response.headers
  }

  get body() {
    return this.response.body
  }
}

function responseBodyOrThrow<T>(response: LSPluginNetResponse<T>) {
  if (response.status >= 200 && response.status < 300) {
    return response.body
  }

  throw new LSPluginNetError(response)
}

/**
 * HTTP client for plugins. Desktop requests are proxied by the host process so
 * iframe plugins can avoid browser CORS limitations. Web requests fall back to
 * browser fetch and are subject to normal CORS rules.
 */
export class LSPluginNet {
  private _cache = new Map<string, CacheEntry>()
  private _events = new EventTarget()

  constructor(private _ctx: LSPluginUser) {
    this._ctx.caller.on(CLIENT_MSG_CALLBACK, (e: any) => {
      const reqId = e?.requestId
      if (!reqId) return

      this._events.dispatchEvent(
        new CustomEvent(genTaskCallbackType(reqId), { detail: e?.payload })
      )
    })
  }

  async request<T = any>(
    options: NetRequestOptions
  ): Promise<LSPluginNetResponse<T>> {
    const method = (options.method || 'GET').toUpperCase() as NetMethod
    const responseType = normalizeResponseType(options.responseType)
    const retry = this.normalizeRetry(options.retry)
    const cacheKey = this.getCacheKey(options, method, responseType)

    if (cacheKey) {
      const cached = this._cache.get(cacheKey)

      if (cached && cached.expires > Date.now()) {
        this._cache.delete(cacheKey)
        this._cache.set(cacheKey, cached)
        return cached.response.clone()
      }

      cached && this._cache.delete(cacheKey)
    }

    let attempt = 0

    while (true) {
      try {
        const response = await this.performRequest<T>(
          options,
          method,
          responseType
        )

        if (attempt < retry.retries && this.shouldRetry(retry, response)) {
          await wait(retry.delay * Math.pow(retry.factor, attempt++))
          continue
        }

        if (cacheKey) {
          this.pruneCache(this.getCacheMaxEntries(options.cache))
          this._cache.set(cacheKey, {
            expires: Date.now() + this.getCacheTTL(options.cache),
            response: response.clone(),
          })
        }

        return response
      } catch (e: any) {
        if (
          options.signal?.aborted ||
          attempt >= retry.retries ||
          !this.shouldRetry(retry, e)
        ) {
          throw e
        }

        await wait(retry.delay * Math.pow(retry.factor, attempt++))
      }
    }
  }

  get<T = any>(
    url: string,
    options?: NetRequestConfig
  ): Promise<T> {
    return this.requestWithMethod<T>('GET', url, options)
  }

  head<T = any>(
    url: string,
    options?: NetRequestConfig
  ): Promise<T> {
    return this.requestWithMethod<T>('HEAD', url, options)
  }

  post<T = any, TBody = any>(
    url: string,
    body?: NetRequestBody<TBody>,
    options?: NetRequestConfig<TBody>
  ): Promise<T> {
    return this.requestWithBody<T, TBody>('POST', url, body, options)
  }

  put<T = any, TBody = any>(
    url: string,
    body?: NetRequestBody<TBody>,
    options?: NetRequestConfig<TBody>
  ): Promise<T> {
    return this.requestWithBody<T, TBody>('PUT', url, body, options)
  }

  patch<T = any, TBody = any>(
    url: string,
    body?: NetRequestBody<TBody>,
    options?: NetRequestConfig<TBody>
  ): Promise<T> {
    return this.requestWithBody<T, TBody>('PATCH', url, body, options)
  }

  delete<T = any, TBody = any>(
    url: string,
    options?: NetRequestConfig<TBody>
  ): Promise<T> {
    return this.requestWithMethod<T, TBody>('DELETE', url, options)
  }

  private requestWithMethod<T = any, TBody = any>(
    method: NetMethod,
    url: string,
    options: NetRequestConfig<TBody> = {}
  ) {
    return this.request<T>({
      ...options,
      url,
      method,
    }).then(responseBodyOrThrow)
  }

  private requestWithBody<T = any, TBody = any>(
    method: Extract<NetMethod, 'POST' | 'PUT' | 'PATCH'>,
    url: string,
    body?: NetRequestBody<TBody>,
    options: NetRequestConfig<TBody> = {}
  ) {
    const requestBody = typeof body === 'undefined' ? options.body : body

    return this.request<T>({
      ...options,
      url,
      method,
      body: requestBody,
    }).then(responseBodyOrThrow)
  }

  private async performRequest<T>(
    options: NetRequestOptions,
    method: NetMethod,
    responseType: HostResponseType
  ) {
    if (this.shouldUseFetchFallback()) {
      return this.performFetchRequest<T>(options, method, responseType)
    }

    try {
      return await this.performProxyRequest<T>(options, method, responseType)
    } catch (e) {
      if (this.shouldFallbackAfterProxyError(e)) {
        return this.performFetchRequest<T>(options, method, responseType)
      }

      throw e
    }
  }

  private async performProxyRequest<T>(
    options: NetRequestOptions,
    method: NetMethod,
    responseType: HostResponseType
  ) {
    if (options.signal?.aborted) {
      throw makeAbortError()
    }

    const abortable = Boolean(options.abortable || options.signal)
    // TODO: instead exper_request of callable apis
    const reqId = this._ctx.Experiments.invokeExperMethod(
      'request',
      this._ctx.baseInfo.id,
      {
        url: options.url,
        method,
        headers: options.headers,
        data: options.body ?? options.data,
        timeout: options.timeout,
        returnType: responseType,
        abortable,
        includeResponse: true,
      }
    )

    if (!reqId) {
      throw new Error('Host HTTP request proxy is not available')
    }

    const callbackType = genTaskCallbackType(reqId)
    const payloadPromise = new Promise<NetResponsePayload<T>>(
      (resolve, reject) => {
        const listener = (event: Event) => {
          const payload = (event as CustomEvent).detail

          this._events.removeEventListener(callbackType, listener)

          if (payload && payload instanceof Error) {
            reject(payload)
          } else {
            resolve(payload)
          }
        }

        this._events.addEventListener(callbackType, listener, { once: true })
      }
    )
    const abort = () => this.abortProxyRequest(reqId, abortable)

    options.signal?.addEventListener('abort', abort, { once: true })

    try {
      const payload = await payloadPromise
      return new LSPluginNetResponse(payload, responseType)
    } finally {
      options.signal?.removeEventListener('abort', abort)
    }
  }

  private abortProxyRequest(reqId: HostRequestID, abortable: boolean) {
    if (!abortable) return
    this._ctx._execCallableAPI('http_request_abort', reqId)
  }

  private async performFetchRequest<T>(
    options: NetRequestOptions,
    method: NetMethod,
    responseType: HostResponseType
  ) {
    if (typeof fetch !== 'function') {
      throw new Error('Browser fetch is not available')
    }

    if (options.signal?.aborted) {
      throw makeAbortError()
    }

    const timeout =
      typeof options.timeout === 'number' && options.timeout > 0
        ? options.timeout
        : undefined
    const controller = timeout || options.signal ? new AbortController() : null
    const abort = () => controller?.abort()
    const timeoutId = timeout ? setTimeout(abort, timeout) : null

    options.signal?.addEventListener('abort', abort, { once: true })

    try {
      const response = await fetch(options.url, {
        method,
        headers: options.headers,
        body: ['GET', 'HEAD'].includes(method)
          ? undefined
          : bodyToFetchBody(options.body ?? options.data),
        signal: controller?.signal || options.signal,
      })
      const body = await this.readFetchBody<T>(response, method, responseType)

      return new LSPluginNetResponse<T>(
        {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          headers: headersToRecord(response.headers),
          body,
        },
        responseType
      )
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      options.signal?.removeEventListener('abort', abort)
    }
  }

  private async readFetchBody<T>(
    response: Response,
    method: NetMethod,
    responseType: HostResponseType
  ) {
    if (method === 'HEAD' || response.status === 204 || response.status === 205) {
      return null as T
    }

    switch (responseType) {
      case 'json':
        return (await response.json()) as T
      case 'text':
        return (await response.text()) as T
      case 'arraybuffer':
        return (await response.arrayBuffer()) as T
      case 'base64':
        return arrayBufferToBase64(await response.arrayBuffer()) as T
    }
  }

  private shouldUseFetchFallback() {
    return Boolean((this._ctx.baseInfo as any)?.webMode)
  }

  private shouldFallbackAfterProxyError(error: unknown) {
    return error == null && typeof fetch === 'function'
  }

  private normalizeRetry(
    retry?: number | NetRetryOptions
  ): NormalizedRetryOptions {
    if (typeof retry === 'number') {
      return { retries: Math.max(0, retry), delay: 300, factor: 2 }
    }

    return {
      retries: Math.max(0, retry?.retries || 0),
      delay: retry?.delay || 300,
      factor: retry?.factor || 2,
      retryOn: retry?.retryOn,
    }
  }

  private shouldRetry(
    retry: NormalizedRetryOptions,
    value: LSPluginNetResponse | Error
  ) {
    const { retryOn } = retry

    if (typeof retryOn === 'function') {
      return retryOn(value)
    }

    if (value instanceof LSPluginNetResponse) {
      return Array.isArray(retryOn)
        ? retryOn.includes(value.status)
        : value.status === 429 || value.status >= 500
    }

    return true
  }

  private getCacheKey(
    options: NetRequestOptions,
    method: NetMethod,
    responseType: HostResponseType
  ) {
    if (!options.cache || !['GET', 'HEAD'].includes(method)) return null

    if (typeof options.cache === 'object' && options.cache.key) {
      return options.cache.key
    }

    return JSON.stringify({
      method,
      url: options.url,
      headers: options.headers || {},
      responseType,
    })
  }

  private getCacheTTL(cache: NetRequestOptions['cache']) {
    return typeof cache === 'object' && typeof cache.ttl === 'number'
      ? Math.max(0, cache.ttl)
      : DEFAULT_CACHE_TTL
  }

  private getCacheMaxEntries(cache: NetRequestOptions['cache']) {
    return typeof cache === 'object' && typeof cache.maxEntries === 'number'
      ? Math.max(1, cache.maxEntries)
      : DEFAULT_CACHE_MAX_ENTRIES
  }

  private pruneCache(maxEntries: number) {
    while (this._cache.size >= maxEntries) {
      const oldest = this._cache.keys().next().value
      if (!oldest) return
      this._cache.delete(oldest)
    }
  }

  get ctx(): LSPluginUser {
    return this._ctx
  }
}


