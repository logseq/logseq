# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.0.14]

### Fixed
- missing arguments of `DB.datascriptQuery`

## [0.0.13]

### Added
- Support block content slot hook `App.onBlockRendererSlotted` with a specific block UUID
- Support plugins calling each other `App.invokeExternalPlugin` with key of models & commands.  
  E.g. (It is recommended that the caller plugin upgrade the SDK to the latest.)
  ```typescript
  // Defined at https://github.com/xyhp915/logseq-journals-calendar/blob/main/src/main.js#L74
  await logseq.App.invokeExternalPlugin('logseq-journals-calendar.models.goToToday')
  
  // Defined at https://github.com/vipzhicheng/logseq-plugin-vim-shortcuts/blob/bec05aeee8/src/keybindings/down.ts#L20
  await logseq.App.invokeExternalPlugin('logseq-plugin-vim-shortcuts.commands.vim-shortcut-down-0')
  ```
- Support api of `Editor.saveFocusedCodeEditorContent` [#FQ](https://github.com/logseq/logseq/issues/7714)
- Support predicate for `DB.datascriptQuery` inputs

### Fixed
- Incorrect hook payload from `Editor.registerHighlightContextMenuItem`
- Auto generate key if not exist for `provideUI` options

## [0.0.12]

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