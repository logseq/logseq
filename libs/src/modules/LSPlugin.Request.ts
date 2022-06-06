import { LSPluginUser, WithOptional } from '../LSPlugin.user'
import { EventEmitter } from 'eventemitter3'

export type IRequestOptions<R = any> = {
  url: string
  headers: Record<string, string>
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data: Object | ArrayBuffer
  timeout: number
  dataType: 'json' | 'text' | 'base64' | 'arraybuffer'
  success: (result: R) => void
  fail: (err: any) => void
  final: () => void
}

export type RequestTaskID = string | number

const CLIENT_MSG_CALLBACK = '#lsp#request#callback'
const genTaskCallbackType = (id: RequestTaskID) => `task_callback_${id}`

/**
 * Request task
 */
export class LSPluginRequestTask<R = any> {
  private readonly _promise: Promise<R>
  private _aborted: boolean = false

  constructor(
    private _client: LSPluginRequest,
    private _requestId: RequestTaskID
  ) {

    this._promise = new Promise<any>((resolve, reject) => {
      if (!this._requestId) {
        return reject(null)
      }

      // task result listener
      this._client.once(
        genTaskCallbackType(this._requestId),
        (e) => {
          resolve(e)
        }
      )
    })
  }

  abort() {
    if (this._aborted) return

    // TODO: impl
  }

  get promise(): Promise<R> {
    return this._promise
  }

  get client(): LSPluginRequest {
    return this._client
  }

  get requestId(): RequestTaskID {
    return this._requestId
  }
}

/**
 * A simple request client
 */
export class LSPluginRequest extends EventEmitter {
  constructor(private ctx: LSPluginUser) {
    super()

    // request callback listener
    this.ctx.caller.on(
      CLIENT_MSG_CALLBACK,
      (e: any) => {
        const reqId = e?.requestId
        if (!reqId) return

        this.emit(genTaskCallbackType(reqId), e?.payload)
      }
    )
  }

  static createRequestTask(
    client: LSPluginRequest,
    requestID: RequestTaskID
  ) {
    return new LSPluginRequestTask(
      client, requestID
    )
  }

  _request<R = any>(options: WithOptional<IRequestOptions<R>, keyof Omit<IRequestOptions, 'url'>>): LSPluginRequestTask<R> {
    const pid = this.ctx.baseInfo.id
    const reqID = this.ctx.Experiments.invokeExperMethod('request', pid, options)

    // TODO: impl
    const task = LSPluginRequest.createRequestTask(
      this.ctx.Request,
      reqID
    )

    return task
  }
}