import { LSPluginUser } from '../LSPlugin.user'

export interface IAsyncStorage {
  getItem(key: string): Promise<string | undefined>

  setItem(key: string, value: string): Promise<void>

  removeItem(key: string): Promise<void>

  hasItem(key: string): Promise<boolean>

  clear(): Promise<void>
}

/**
 * A storage based on local files under specific context
 */
class LSPluginFileStorage implements IAsyncStorage {
  /**
   * @param ctx
   */
  constructor(private ctx: LSPluginUser) {}

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
  setItem(key: string, value: string): Promise<void> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'write-plugin-storage-file',
      args: [this.ctxId, key, value],
    })
  }

  /**
   * @param key
   */
  getItem(key: string): Promise<string | undefined> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'read-plugin-storage-file',
      args: [this.ctxId, key],
    })
  }

  /**
   * @param key
   */
  removeItem(key: string): Promise<void> {
    return this.ctx.caller.call(`api:call`, {
      method: 'unlink-plugin-storage-file',
      args: [this.ctxId, key],
    })
  }

  /**
   * Clears the storage
   */
  clear(): Promise<void> {
    return this.ctx.caller.call(`api:call`, {
      method: 'clear-plugin-storage-files',
      args: [this.ctxId],
    })
  }

  /**
   * @param key
   */
  hasItem(key: string): Promise<boolean> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'exist-plugin-storage-file',
      args: [this.ctxId, key],
    })
  }
}

export { LSPluginFileStorage }
