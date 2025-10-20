;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.app
  (:require [logseq.core :as core]))

(defn- get-info-impl
  [key]
  (let [method (aget (aget js/logseq "App") "getInfo")
        arg-key key
        args [arg-key]]
    (core/call-method method args)))

(defn get-info
  ([]
   (get-info-impl nil))
  ([key]
   (get-info-impl key)))

(defn get-user-info
  []
  (let [method (aget (aget js/logseq "App") "getUserInfo")
        args []]
    (core/call-method method args)))

(defn get-user-configs
  []
  (let [method (aget (aget js/logseq "App") "getUserConfigs")
        args []]
    (core/call-method method args)))

(defn register-search-service
  [s]
  (let [method (aget (aget js/logseq "App") "registerSearchService")
        arg-s s
        args [arg-s]]
    (core/call-method method args)))

(defn register-command
  [type opts action]
  (let [method (aget (aget js/logseq "App") "registerCommand")
        arg-type type
        arg-opts opts
        arg-action (core/convert-arg {:bean-to-js true} action)
        args [arg-type arg-opts arg-action]]
    (core/call-method method args)))

(defn register-command-palette
  [opts action]
  (let [method (aget (aget js/logseq "App") "registerCommandPalette")
        arg-opts opts
        arg-action (core/convert-arg {:bean-to-js true} action)
        args [arg-opts arg-action]]
    (core/call-method method args)))

(defn- register-command-shortcut-impl
  [keybinding action opts]
  (let [method (aget (aget js/logseq "App") "registerCommandShortcut")
        arg-keybinding keybinding
        arg-action (core/convert-arg {:bean-to-js true} action)
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-keybinding arg-action arg-opts]]
    (core/call-method method args)))

(defn register-command-shortcut
  "Supported key names"
  ([keybinding action]
   (register-command-shortcut-impl keybinding action nil))
  ([keybinding action opts]
   (register-command-shortcut-impl keybinding action opts)))

(defn invoke-external-command
  "Supported all registered palette commands"
  [type & args]
  (let [method (aget (aget js/logseq "App") "invokeExternalCommand")
        arg-type type
        rest-args (map #(core/convert-arg {:bean-to-js true} %) args)
        args (into [arg-type] rest-args)]
    (core/call-method method args)))

(defn invoke-external-plugin
  "Call external plugin command provided by models or registered commands"
  [type & args]
  (let [method (aget (aget js/logseq "App") "invokeExternalPlugin")
        arg-type type
        rest-args (map #(core/convert-arg {:bean-to-js true} %) args)
        args (into [arg-type] rest-args)]
    (core/call-method method args)))

(defn get-external-plugin
  [pid]
  (let [method (aget (aget js/logseq "App") "getExternalPlugin")
        arg-pid pid
        args [arg-pid]]
    (core/call-method method args)))

(defn get-state-from-store
  "Get state from app store\nvalid state is here\nhttps://github.com/logseq/logseq/blob/master/src/main/frontend/state.cljs#L27"
  [path]
  (let [method (aget (aget js/logseq "App") "getStateFromStore")
        arg-path path
        args [arg-path]]
    (core/call-method method args)))

(defn set-state-from-store
  [path value]
  (let [method (aget (aget js/logseq "App") "setStateFromStore")
        arg-path path
        arg-value (core/convert-arg {:bean-to-js true} value)
        args [arg-path arg-value]]
    (core/call-method method args)))

(defn relaunch
  []
  (let [method (aget (aget js/logseq "App") "relaunch")
        args []]
    (core/call-method method args)))

(defn quit
  []
  (let [method (aget (aget js/logseq "App") "quit")
        args []]
    (core/call-method method args)))

(defn open-external-link
  [url]
  (let [method (aget (aget js/logseq "App") "openExternalLink")
        arg-url url
        args [arg-url]]
    (core/call-method method args)))

(defn exec-git-command
  [args]
  (let [method (aget (aget js/logseq "App") "execGitCommand")
        arg-args args
        args [arg-args]]
    (core/call-method method args)))

(defn get-current-graph
  []
  (let [method (aget (aget js/logseq "App") "getCurrentGraph")
        args []]
    (core/call-method method args)))

(defn check-current-is-db-graph
  []
  (let [method (aget (aget js/logseq "App") "checkCurrentIsDbGraph")
        args []]
    (core/call-method method args)))

(defn get-current-graph-configs
  [& keys]
  (let [method (aget (aget js/logseq "App") "getCurrentGraphConfigs")
        rest-keys (vec keys)
        args (into [] rest-keys)]
    (core/call-method method args)))

(defn set-current-graph-configs
  [configs]
  (let [method (aget (aget js/logseq "App") "setCurrentGraphConfigs")
        arg-configs configs
        args [arg-configs]]
    (core/call-method method args)))

(defn get-current-graph-favorites
  []
  (let [method (aget (aget js/logseq "App") "getCurrentGraphFavorites")
        args []]
    (core/call-method method args)))

(defn get-current-graph-recent
  []
  (let [method (aget (aget js/logseq "App") "getCurrentGraphRecent")
        args []]
    (core/call-method method args)))

(defn get-current-graph-templates
  []
  (let [method (aget (aget js/logseq "App") "getCurrentGraphTemplates")
        args []]
    (core/call-method method args)))

(defn- push-state-impl
  [k params query]
  (let [method (aget (aget js/logseq "App") "pushState")
        arg-k k
        arg-params (core/convert-arg {:bean-to-js true} params)
        arg-query (core/convert-arg {:bean-to-js true} query)
        args [arg-k arg-params arg-query]]
    (core/call-method method args)))

(defn push-state
  ([k]
   (push-state-impl k nil nil))
  ([k params]
   (push-state-impl k params nil))
  ([k params query]
   (push-state-impl k params query)))

(defn- replace-state-impl
  [k params query]
  (let [method (aget (aget js/logseq "App") "replaceState")
        arg-k k
        arg-params (core/convert-arg {:bean-to-js true} params)
        arg-query (core/convert-arg {:bean-to-js true} query)
        args [arg-k arg-params arg-query]]
    (core/call-method method args)))

(defn replace-state
  ([k]
   (replace-state-impl k nil nil))
  ([k params]
   (replace-state-impl k params nil))
  ([k params query]
   (replace-state-impl k params query)))

(defn get-template
  [name]
  (let [method (aget (aget js/logseq "App") "getTemplate")
        arg-name name
        args [arg-name]]
    (core/call-method method args)))

(defn exist-template
  [name]
  (let [method (aget (aget js/logseq "App") "existTemplate")
        arg-name name
        args [arg-name]]
    (core/call-method method args)))

(defn- create-template-impl
  [target name opts]
  (let [method (aget (aget js/logseq "App") "createTemplate")
        arg-target target
        arg-name name
        arg-opts opts
        args [arg-target arg-name arg-opts]]
    (core/call-method method args)))

(defn create-template
  ([target name]
   (create-template-impl target name nil))
  ([target name opts]
   (create-template-impl target name opts)))

(defn remove-template
  [name]
  (let [method (aget (aget js/logseq "App") "removeTemplate")
        arg-name name
        args [arg-name]]
    (core/call-method method args)))

(defn insert-template
  [target name]
  (let [method (aget (aget js/logseq "App") "insertTemplate")
        arg-target target
        arg-name name
        args [arg-target arg-name]]
    (core/call-method method args)))

(defn set-zoom-factor
  [factor]
  (let [method (aget (aget js/logseq "App") "setZoomFactor")
        arg-factor factor
        args [arg-factor]]
    (core/call-method method args)))

(defn set-full-screen
  [flag]
  (let [method (aget (aget js/logseq "App") "setFullScreen")
        arg-flag flag
        args [arg-flag]]
    (core/call-method method args)))

(defn set-left-sidebar-visible
  [flag]
  (let [method (aget (aget js/logseq "App") "setLeftSidebarVisible")
        arg-flag flag
        args [arg-flag]]
    (core/call-method method args)))

(defn set-right-sidebar-visible
  [flag]
  (let [method (aget (aget js/logseq "App") "setRightSidebarVisible")
        arg-flag flag
        args [arg-flag]]
    (core/call-method method args)))

(defn- clear-right-sidebar-blocks-impl
  [opts]
  (let [method (aget (aget js/logseq "App") "clearRightSidebarBlocks")
        arg-opts opts
        args [arg-opts]]
    (core/call-method method args)))

(defn clear-right-sidebar-blocks
  ([]
   (clear-right-sidebar-blocks-impl nil))
  ([opts]
   (clear-right-sidebar-blocks-impl opts)))

(defn register-ui-item
  [type opts]
  (let [method (aget (aget js/logseq "App") "registerUIItem")
        arg-type type
        arg-opts opts
        args [arg-type arg-opts]]
    (core/call-method method args)))

(defn register-page-menu-item
  [tag action]
  (let [method (aget (aget js/logseq "App") "registerPageMenuItem")
        arg-tag tag
        arg-action (core/convert-arg {:bean-to-js true} action)
        args [arg-tag arg-action]]
    (core/call-method method args)))

(defn on-current-graph-changed
  [callback]
  (let [method (aget (aget js/logseq "App") "onCurrentGraphChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-graph-after-indexed
  [callback]
  (let [method (aget (aget js/logseq "App") "onGraphAfterIndexed")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-theme-mode-changed
  [callback]
  (let [method (aget (aget js/logseq "App") "onThemeModeChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-theme-changed
  [callback]
  (let [method (aget (aget js/logseq "App") "onThemeChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-today-journal-created
  [callback]
  (let [method (aget (aget js/logseq "App") "onTodayJournalCreated")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-before-command-invoked
  [condition callback]
  (let [method (aget (aget js/logseq "App") "onBeforeCommandInvoked")
        arg-condition condition
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-condition arg-callback]]
    (core/call-method method args)))

(defn on-after-command-invoked
  [condition callback]
  (let [method (aget (aget js/logseq "App") "onAfterCommandInvoked")
        arg-condition condition
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-condition arg-callback]]
    (core/call-method method args)))

(defn on-block-renderer-slotted
  "provide ui slot to specific block with UUID"
  [condition callback]
  (let [method (aget (aget js/logseq "App") "onBlockRendererSlotted")
        arg-condition condition
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-condition arg-callback]]
    (core/call-method method args)))

(defn on-macro-renderer-slotted
  "provide ui slot to block `renderer` macro for `{{renderer arg1, arg2}}`"
  [callback]
  (let [method (aget (aget js/logseq "App") "onMacroRendererSlotted")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-page-head-actions-slotted
  [callback]
  (let [method (aget (aget js/logseq "App") "onPageHeadActionsSlotted")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-route-changed
  [callback]
  (let [method (aget (aget js/logseq "App") "onRouteChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-sidebar-visible-changed
  [callback]
  (let [method (aget (aget js/logseq "App") "onSidebarVisibleChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))
