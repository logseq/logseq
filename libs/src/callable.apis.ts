import { PluginLocal } from './LSPlugin.core'

/**
 * theses apis run in host from user callable apis,
 * like logseq.apis.cljs but here is for js/ts.
 */

export function setSDKMetadata(this: PluginLocal, data: any) {
  if (this?.sdk && data) {
    this.sdk = Object.assign({}, this.sdk, data)
  }
}
