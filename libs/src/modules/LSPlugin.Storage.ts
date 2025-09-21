import { LSPluginUser } from '../LSPlugin.user'

export interface IAsyncStorage {
  getItem(key: string): Promise<string | undefined>

  setItem(key: string, value: string): Promise<void>

  removeItem(key: string): Promise<void>

  hasItem(key: string): Promise<boolean>

  allKeys(): Promise<Array<string>>

  clear(): Promise<void>
}

/**
 * A storage based on local files under specific context
 */
class LSPluginFileStorage implements IAsyncStorage {
  /**
   * @param ctx
   * @param opts
   */
  constructor(
    private ctx: LSPluginUser,
    private opts?: {
      assets: boolean
    }
  ) {}

  /**
   * plugin id
   */
  get ctxId() {
    return this.ctx.baseInfo.id
  }

  /**
   * @param key A string as file name that support nested directory
   * @param value Storage value
   */
  setItem(key: string, value: string | any): Promise<void> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'write-plugin-storage-file',
      args: [this.ctxId, key, value, this.opts?.assets],
    })
  }

  /**
   * @param key
   */
  getItem(key: string): Promise<string | any> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'read-plugin-storage-file',
      args: [this.ctxId, key, this.opts?.assets],
    })
  }

  /**
   * @param key
   */
  removeItem(key: string): Promise<void> {
    return this.ctx.caller.call(`api:call`, {
      method: 'unlink-plugin-storage-file',
      args: [this.ctxId, key, this.opts?.assets],
    })
  }

  /**
   * Get all path file keys
   */
  allKeys(): Promise<Array<string>> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'list-plugin-storage-files',
      args: [this.ctxId, this.opts?.assets],
    })
  }

  /**
   * Clears the storage
   */
  clear(): Promise<void> {
    return this.ctx.caller.call(`api:call`, {
      method: 'clear-plugin-storage-files',
      args: [this.ctxId, this.opts?.assets],
    })
  }

  /**
   * @param key
   */
  hasItem(key: string): Promise<boolean> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'exist-plugin-storage-file',
      args: [this.ctxId, key, this.opts?.assets],
    })
  }
}

export { LSPluginFileStorage }
