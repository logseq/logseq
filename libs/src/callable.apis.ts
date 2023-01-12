import { PluginLocal } from './LSPlugin.core'

/**
 * Run in host
 */
export function setSDKMetadata(this: PluginLocal, data: any) {
  if (this?.sdk && data) {
    this.sdk = Object.assign({}, this.sdk, data)
  }
}
