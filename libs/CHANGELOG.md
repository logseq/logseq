# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.0.11]

### Added

- All configurations of current graph.
  `App.getCurrentGraphConfigs: () => Promise<any>`
- All favorite pages list of current graph.
  `App.getCurrentGraphFavorites: () => Promise<Array<string> | null>`
- All recent pages list of current graph.
  `App.getCurrentGraphRecent: () => Promise<Array<string> | null>`
- Clear right sidebar blocks.
  `App.clearRightSidebarBlocks: (opts?: { close: boolean }) => void`
- Support register `CodeMirror` enhancer. _#Experiment feature_
  `Experiments.registerExtensionsEnhancer<T = any>(type: 'katex' | 'codemirror', enhancer: (v: T) => Promise<any>)`
- Support hooks for app search service. _#Alpha stage_
  `App.registerSearchService<T extends IPluginSearchServiceHooks>(s: T): void`
- Support `focus` option for `App.insertBlock`. Credit
  to [[[tennox](https://github.com/tennox)]] [#PR](https://github.com/logseq/logseq/commit/4217057a44de65e5c64be37857af2fb4e9534b24)

### Fixed

- Adjust build script to be compatible for `shadow-cljs` bundler.
  > How to set up a clojurescript project with shadow-cljs?
  > https://github.com/rlhk/logseq-url-plus/blob/main/doc/dev-notes.md