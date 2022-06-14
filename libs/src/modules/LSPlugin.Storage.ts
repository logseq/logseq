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
   * Create a file, or edit a file with the specified key
   * @param key - the file name of the file in plugin storage
   * @param value The value of the contents on the file
   */
  setItem(key: string, value: string): Promise<void> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'write-plugin-storage-file',
      args: [this.ctxId, key, value],
    })
  }

  /**
   * Returns the contents of a speciifed file from plugin storage.
   * @param key - the file name of the file in plugin storage
   */
  getItem(key: string): Promise<string | undefined> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'read-plugin-storage-file',
      args: [this.ctxId, key],
    })
  }

  /**
   * Removes an item from the plugin storage
   * @param key - the file name of the file in plugin storage
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
   * Checks if the plugin storage has a file with specfied file name
   * @param key - the file name of the file in plugin storage
   * @example
   * ```ts
   * logseq.FileStorage.hasItem("fileName.md")
   * ```
   */
  hasItem(key: string): Promise<boolean> {
    return this.ctx.caller.callAsync(`api:call`, {
      method: 'exist-plugin-storage-file',
      args: [this.ctxId, key],
    })
  }
}

export { LSPluginFileStorage }
