import { IPluginSearchServiceHooks } from '../LSPlugin'
import { LSPluginUser } from '../LSPlugin.user'

export class LSPluginSearchService {

  /**
   * @param ctx
   * @param serviceHooks
   */
  constructor(
    private ctx: LSPluginUser,
    private serviceHooks: IPluginSearchServiceHooks
  ) {}
}