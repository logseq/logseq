import { PluginLocal } from './LSPlugin.core'

/**
 * These APIs run in the host and are callable by users,
 * similar to logseq.apis.cljs but for JS/TS.
 */

export function setSDKMetadata(this: PluginLocal, data: any) {
  if (this?.sdk && data) {
    this.sdk = Object.assign({}, this.sdk, data)
  }
}
