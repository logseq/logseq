import { LSPluginUser } from '../LSPlugin.user'
import { PluginLocal } from '../LSPlugin.core'
import { safeSnakeCase } from '../common'

/**
 * Declarative condition for matching a block's properties map.
 * Operators: has, equals, in, not, any, all.
 */
export type BlockPropertiesCondition =
  | { has: string }
  | { equals: [string, any] }
  | { in: [string, Array<any>] }
  | { not: BlockPropertiesCondition }
  | { any: Array<BlockPropertiesCondition> }
  | { all: Array<BlockPropertiesCondition> }

export type BlockPropertiesRendererProps = {
  blockId: string
  properties: Record<string, any>
}

export type BlockRendererChild = Record<string, any> & {
  children?: Array<BlockRendererChild>
}

export type BlockRendererProps = BlockPropertiesRendererProps & {
  uuid?: string
  page?: string
  content?: string
  format?: string
  children?: Array<BlockRendererChild>
}

export type BlockPropertiesPredicate = (
  props: BlockPropertiesRendererProps
) => boolean

export type BlockRendererPredicate = (
  props: BlockRendererProps
) => boolean

/**
 * WARN: These are some experience features and might be adjusted at any time.
 * These unofficial plugins that use these APIs are temporarily
 * may not be supported on the Marketplace.
 */
export class LSPluginExperiments {
  constructor(private ctx: LSPluginUser) {}

  get React(): unknown {
    return this.ensureHostScope().React
  }

  get ReactDOM(): unknown {
    return this.ensureHostScope().ReactDOM
  }

  get Components() {
    const exper = this.ensureHostScope().logseq.sdk.experiments
    return {
      Editor: exper.cp_page_editor as (props: { page: string } & any) => any,
    }
  }

  get Utils() {
    const utils = this.ensureHostScope().logseq.sdk.utils
    const withCall = (name: string): ((input: any) => any) =>
      utils[safeSnakeCase(name)]
    return {
      toClj: withCall('toClj'),
      jsxToClj: withCall('jsxToClj'),
      toJs: withCall('toJs'),
      toKeyword: withCall('toKeyword'),
      toSymbol: withCall('toSymbol'),
    }
  }

  get pluginLocal(): PluginLocal {
    return this.ensureHostScope().LSPluginCore.ensurePlugin(
      this.ctx.baseInfo.id
    )
  }

  public invokeExperMethod(type: string, ...args: Array<any>) {
    const host = this.ensureHostScope()
    type = safeSnakeCase(type)?.toLowerCase()
    const fn =
      host.logseq.api['exper_' + type] || host.logseq.sdk.experiments[type]
    return fn?.apply(host, args)
  }

  async loadScripts(...scripts: Array<string>) {
    scripts = scripts.map((it) => {
      if (!it?.startsWith('http')) {
        return this.ctx.resolveResourceFullUrl(it)
      }

      return it
    })

    scripts.unshift(this.ctx.baseInfo.id)
    await this.invokeExperMethod('loadScripts', ...scripts)
  }

  registerFencedCodeRenderer(
    lang: string,
    opts: {
      edit?: boolean
      before?: () => Promise<void>
      subs?: Array<string>
      render: (props: { content: string }) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerFencedCodeRenderer',
      this.ctx.baseInfo.id,
      lang,
      opts
    )
  }

  registerDaemonRenderer(
    key: string,
    opts: {
      before?: () => Promise<void>
      subs?: Array<string>
      render: (props: {}) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerDaemonRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  registerHostedRenderer(
    key: string,
    opts: {
      title?: string
      subs?: Array<string>
      type?: string
      render: (props: {}) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerHostedRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  registerSidebarRenderer(
    key: string,
    opts: {
      title?: string
      subs?: Array<string>
      render: (props: {}) => any
      [k: string]: any
    }
  ) {
    key = `_sidebar.${key}`
    opts.type = 'sidebar'
    return this.registerHostedRenderer(key, opts)
  }

  registerRouteRenderer(
    key: string,
    opts: {
      name?: string
      subs?: Array<string>
      path: string
      render: (props: {}) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerRouteRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  /**
   * Register a custom renderer for the block properties area.
   * The renderer is shown when the block's properties match the `when` condition.
   * `when` may be either a declarative condition object or a synchronous predicate.
   *
   * @param key Unique key for this renderer (scoped to the plugin).
   * @param opts Renderer options.
   * @param opts.when Optional condition or synchronous predicate; if omitted, always matches.
   * @param opts.mode "prepend" | "append" (default) | "replace".
   * @param opts.priority Higher number wins when multiple replace renderers match.
   * @param opts.subs Reserved subscription list for future reactive updates.
   * @param opts.render React function component receiving `{ blockId, properties }`.
   */
  registerBlockPropertiesRenderer(
    key: string,
    opts: {
      when?: BlockPropertiesCondition | BlockPropertiesPredicate
      mode?: 'prepend' | 'append' | 'replace'
      priority?: number
      subs?: Array<string>
      render: (props: BlockPropertiesRendererProps) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerBlockPropertiesRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  /**
   * Register a custom renderer for the block body.
   * When the synchronous predicate matches, the plugin renderer replaces the
   * default outline view by default. Users can switch back to outline view via
   * an explicit UI toggle on each matched block.
   *
   * @param key Unique key for this renderer (scoped to the plugin).
   * @param opts Renderer options.
   * @param opts.when Optional synchronous predicate; if omitted, always matches.
   * @param opts.includeChildren When true, passes the block's recursive children
   * tree to the renderer and hides native outline children while the plugin
   * renderer is active.
   * @param opts.priority Higher number wins when multiple block renderers match.
   * @param opts.subs Reserved subscription list for future reactive updates.
   * @param opts.render React function component receiving block renderer props.
   */
  registerBlockRenderer(
    key: string,
    opts: {
      when?: BlockRendererPredicate
      includeChildren?: boolean
      priority?: number
      subs?: Array<string>
      render: (props: BlockRendererProps) => any
    }
  ) {
    return this.invokeExperMethod(
      'registerBlockRenderer',
      this.ctx.baseInfo.id,
      key,
      opts
    )
  }

  registerExtensionsEnhancer<T = any>(
    type: 'katex' | 'codemirror',
    enhancer: (v: T) => Promise<any>
  ) {
    const host = this.ensureHostScope()

    switch (type) {
      case 'katex':
        if (host.katex) {
          enhancer(host.katex).catch(console.error)
        }
        break
      default:
    }

    return this.invokeExperMethod(
      'registerExtensionsEnhancer',
      this.ctx.baseInfo.id,
      type,
      enhancer
    )
  }

  ensureHostScope(): any {
    try {
      window.top?.document
    } catch (_e) {
      console.error('Can not access host scope!')
    }

    return window.top
  }
}
