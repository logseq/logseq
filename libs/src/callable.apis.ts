import { PluginLocal } from './LSPlugin.core'

export function setSDKMetadata(this: PluginLocal, data: any) {
  if (this?.sdk && data) {
    this.sdk = Object.assign({}, this.sdk, data)
  }
}
