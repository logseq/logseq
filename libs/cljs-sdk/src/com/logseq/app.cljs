;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.app
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "App"))

(defn- get-info-impl
  [key]
  (let [method (aget api-proxy "getInfo")
        args [key]]
    (core/call-method api-proxy method args)))

(defn get-info
  ([]
   (get-info-impl nil))
  ([key]
   (get-info-impl key)))

(defn get-user-info
  []
  (let [method (aget api-proxy "getUserInfo")
        args []]
    (core/call-method api-proxy method args)))

(defn get-user-configs
  []
  (let [method (aget api-proxy "getUserConfigs")
        args []]
    (core/call-method api-proxy method args)))

(defn register-search-service
  [s]
  (let [method (aget api-proxy "registerSearchService")
        args [s]]
    (core/call-method api-proxy method args)))

(defn register-command
  [type opts action]
  (let [method (aget api-proxy "registerCommand")
        args [type opts action]]
    (core/call-method api-proxy method args)))

(defn register-command-palette
  [opts action]
  (let [method (aget api-proxy "registerCommandPalette")
        args [opts action]]
    (core/call-method api-proxy method args)))

(defn- register-command-shortcut-impl
  [keybinding action opts]
  (let [method (aget api-proxy "registerCommandShortcut")
        args [keybinding action opts]]
    (core/call-method api-proxy method args)))

(defn register-command-shortcut
  "Supported key names"
  ([keybinding action]
   (register-command-shortcut-impl keybinding action nil))
  ([keybinding action opts]
   (register-command-shortcut-impl keybinding action opts)))

(defn invoke-external-command
  "Supported all registered palette commands"
  [type & args]
  (let [method (aget api-proxy "invokeExternalCommand")
        rest-args (vec args)
        args (into [type] rest-args)]
    (core/call-method api-proxy method args)))

(defn invoke-external-plugin
  "Call external plugin command provided by models or registered commands"
  [type & args]
  (let [method (aget api-proxy "invokeExternalPlugin")
        rest-args (vec args)
        args (into [type] rest-args)]
    (core/call-method api-proxy method args)))

(defn get-external-plugin
  [pid]
  (let [method (aget api-proxy "getExternalPlugin")
        args [pid]]
    (core/call-method api-proxy method args)))

(defn get-state-from-store
  "Get state from app store\nvalid state is here\nhttps://github.com/logseq/logseq/blob/master/src/main/frontend/state.cljs#L27"
  [path]
  (let [method (aget api-proxy "getStateFromStore")
        args [path]]
    (core/call-method api-proxy method args)))

(defn set-state-from-store
  [path value]
  (let [method (aget api-proxy "setStateFromStore")
        args [path value]]
    (core/call-method api-proxy method args)))

(defn relaunch
  []
  (let [method (aget api-proxy "relaunch")
        args []]
    (core/call-method api-proxy method args)))

(defn quit
  []
  (let [method (aget api-proxy "quit")
        args []]
    (core/call-method api-proxy method args)))

(defn open-external-link
  [url]
  (let [method (aget api-proxy "openExternalLink")
        args [url]]
    (core/call-method api-proxy method args)))

(defn exec-git-command
  [args]
  (let [method (aget api-proxy "execGitCommand")
        args [args]]
    (core/call-method api-proxy method args)))

(defn get-current-graph
  []
  (let [method (aget api-proxy "getCurrentGraph")
        args []]
    (core/call-method api-proxy method args)))

(defn check-current-is-db-graph
  []
  (let [method (aget api-proxy "checkCurrentIsDbGraph")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-graph-configs
  [& keys]
  (let [method (aget api-proxy "getCurrentGraphConfigs")
        rest-keys (vec keys)
        args (into [] rest-keys)]
    (core/call-method api-proxy method args)))

(defn set-current-graph-configs
  [configs]
  (let [method (aget api-proxy "setCurrentGraphConfigs")
        args [configs]]
    (core/call-method api-proxy method args)))

(defn get-current-graph-favorites
  []
  (let [method (aget api-proxy "getCurrentGraphFavorites")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-graph-recent
  []
  (let [method (aget api-proxy "getCurrentGraphRecent")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-graph-templates
  []
  (let [method (aget api-proxy "getCurrentGraphTemplates")
        args []]
    (core/call-method api-proxy method args)))

(defn- push-state-impl
  [k params query]
  (let [method (aget api-proxy "pushState")
        args [k params query]]
    (core/call-method api-proxy method args)))

(defn push-state
  ([k]
   (push-state-impl k nil nil))
  ([k params]
   (push-state-impl k params nil))
  ([k params query]
   (push-state-impl k params query)))

(defn- replace-state-impl
  [k params query]
  (let [method (aget api-proxy "replaceState")
        args [k params query]]
    (core/call-method api-proxy method args)))

(defn replace-state
  ([k]
   (replace-state-impl k nil nil))
  ([k params]
   (replace-state-impl k params nil))
  ([k params query]
   (replace-state-impl k params query)))

(defn get-template
  [name]
  (let [method (aget api-proxy "getTemplate")
        args [name]]
    (core/call-method api-proxy method args)))

(defn exist-template
  [name]
  (let [method (aget api-proxy "existTemplate")
        args [name]]
    (core/call-method api-proxy method args)))

(defn- create-template-impl
  [target name opts]
  (let [method (aget api-proxy "createTemplate")
        args [target name opts]]
    (core/call-method api-proxy method args)))

(defn create-template
  ([target name]
   (create-template-impl target name nil))
  ([target name opts]
   (create-template-impl target name opts)))

(defn remove-template
  [name]
  (let [method (aget api-proxy "removeTemplate")
        args [name]]
    (core/call-method api-proxy method args)))

(defn insert-template
  [target name]
  (let [method (aget api-proxy "insertTemplate")
        args [target name]]
    (core/call-method api-proxy method args)))

(defn set-zoom-factor
  [factor]
  (let [method (aget api-proxy "setZoomFactor")
        args [factor]]
    (core/call-method api-proxy method args)))

(defn set-full-screen
  [flag]
  (let [method (aget api-proxy "setFullScreen")
        args [flag]]
    (core/call-method api-proxy method args)))

(defn set-left-sidebar-visible
  [flag]
  (let [method (aget api-proxy "setLeftSidebarVisible")
        args [flag]]
    (core/call-method api-proxy method args)))

(defn set-right-sidebar-visible
  [flag]
  (let [method (aget api-proxy "setRightSidebarVisible")
        args [flag]]
    (core/call-method api-proxy method args)))

(defn- clear-right-sidebar-blocks-impl
  [opts]
  (let [method (aget api-proxy "clearRightSidebarBlocks")
        args [opts]]
    (core/call-method api-proxy method args)))

(defn clear-right-sidebar-blocks
  ([]
   (clear-right-sidebar-blocks-impl nil))
  ([opts]
   (clear-right-sidebar-blocks-impl opts)))

(defn register-ui-item
  [type opts]
  (let [method (aget api-proxy "registerUIItem")
        args [type opts]]
    (core/call-method api-proxy method args)))

(defn register-page-menu-item
  [tag action]
  (let [method (aget api-proxy "registerPageMenuItem")
        args [tag action]]
    (core/call-method api-proxy method args)))

(defn on-current-graph-changed
  [callback]
  (let [method (aget api-proxy "onCurrentGraphChanged")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-graph-after-indexed
  [callback]
  (let [method (aget api-proxy "onGraphAfterIndexed")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-theme-mode-changed
  [callback]
  (let [method (aget api-proxy "onThemeModeChanged")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-theme-changed
  [callback]
  (let [method (aget api-proxy "onThemeChanged")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-today-journal-created
  [callback]
  (let [method (aget api-proxy "onTodayJournalCreated")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-before-command-invoked
  [condition callback]
  (let [method (aget api-proxy "onBeforeCommandInvoked")
        args [condition callback]]
    (core/call-method api-proxy method args)))

(defn on-after-command-invoked
  [condition callback]
  (let [method (aget api-proxy "onAfterCommandInvoked")
        args [condition callback]]
    (core/call-method api-proxy method args)))

(defn on-block-renderer-slotted
  "provide ui slot to specific block with UUID"
  [condition callback]
  (let [method (aget api-proxy "onBlockRendererSlotted")
        args [condition callback]]
    (core/call-method api-proxy method args)))

(defn on-macro-renderer-slotted
  "provide ui slot to block `renderer` macro for `{{renderer arg1, arg2}}`"
  [callback]
  (let [method (aget api-proxy "onMacroRendererSlotted")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-page-head-actions-slotted
  [callback]
  (let [method (aget api-proxy "onPageHeadActionsSlotted")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-route-changed
  [callback]
  (let [method (aget api-proxy "onRouteChanged")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-sidebar-visible-changed
  [callback]
  (let [method (aget api-proxy "onSidebarVisibleChanged")
        args [callback]]
    (core/call-method api-proxy method args)))
