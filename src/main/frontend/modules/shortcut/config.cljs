(ns frontend.modules.shortcut.config
  (:require [frontend.components.commit :as commit]
            [frontend.extensions.srs.handler :as srs]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.history :as history]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.journal :as journal-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.modules.shortcut.dicts :as dicts]
            [frontend.modules.shortcut.before :as m]
            [frontend.state :as state]
            [frontend.util :refer [mac?] :as util]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [clojure.data :as data]
            [medley.core :as medley]))

;; TODO: Namespace all-default-keyboard-shortcuts keys with `:command` e.g.
;; `:command.date-picker/complete`. They are namespaced in translation but
;; almost everywhere else they are not which could cause needless conflicts
;; with other config keys

;; To add a new entry to this map, first add it here and then a description for
;; it in frontend.modules.shortcut.dicts/all-default-keyboard-shortcuts.
;; A shortcut is a map with the following keys:
;;  * :binding - A string representing a keybinding. Avoid using single letter
;;    shortcuts to allow chords that start with those characters
;;  * :fn - Fn or a qualified keyword that represents a fn
;;  * :inactive - Optional boolean to disable a shortcut for certain conditions
;;    e.g. a given platform or feature condition
(def ^:large-vars/data-var all-default-keyboard-shortcuts
  ;; BUG: Actually, "enter" is registered by mixin behind a "when inputing" guard
  ;; So this setting item does not cover all cases.
  ;; See-also: frontend.components.datetime/time-repeater
  {:date-picker/complete         {:binding "enter"
                                  :fn      ui-handler/shortcut-complete}

   :date-picker/prev-day         {:binding "left"
                                  :fn      ui-handler/shortcut-prev-day}

   :date-picker/next-day         {:binding "right"
                                  :fn      ui-handler/shortcut-next-day}

   :date-picker/prev-week        {:binding ["up" "ctrl+p"]
                                  :fn      ui-handler/shortcut-prev-week}

   :date-picker/next-week        {:binding ["down" "ctrl+n"]
                                  :fn      ui-handler/shortcut-next-week}

   :pdf/previous-page            {:binding "alt+p"
                                  :fn      pdf-utils/prev-page}

   :pdf/next-page                {:binding "alt+n"
                                  :fn      pdf-utils/next-page}

   :pdf/close                    {:binding "alt+x"
                                  :fn      #(state/set-state! :pdf/current nil)}

   :pdf/find                     {:binding "alt+f"
                                  :fn      pdf-utils/open-finder}

   :auto-complete/complete       {:binding "enter"
                                  :fn      ui-handler/auto-complete-complete}

   :auto-complete/prev           {:binding ["up" "ctrl+p"]
                                  :fn      ui-handler/auto-complete-prev}

   :auto-complete/next           {:binding ["down" "ctrl+n"]
                                  :fn      ui-handler/auto-complete-next}

   :auto-complete/shift-complete {:binding "shift+enter"
                                  :fn      ui-handler/auto-complete-shift-complete}

   :auto-complete/open-link      {:binding "mod+o"
                                  :fn      ui-handler/auto-complete-open-link}

   :cards/toggle-answers         {:binding "s"
                                  :fn      srs/toggle-answers}

   :cards/next-card              {:binding "n"
                                  :fn      srs/next-card}

   :cards/forgotten              {:binding "f"
                                  :fn      srs/forgotten}

   :cards/remembered             {:binding "r"
                                  :fn      srs/remembered}

   :cards/recall                 {:binding "t"
                                  :fn      srs/recall}

   :editor/escape-editing        {:binding false
                                  :fn      (fn [_ _]
                                             (editor-handler/escape-editing))}

   :editor/backspace             {:binding "backspace"
                                  :fn      editor-handler/editor-backspace}

   :editor/delete                {:binding "delete"
                                  :fn      editor-handler/editor-delete}

   :editor/new-block             {:binding "enter"
                                  :fn      editor-handler/keydown-new-block-handler}

   :editor/new-line              {:binding "shift+enter"
                                  :fn      editor-handler/keydown-new-line-handler}

   :editor/new-whiteboard        {:binding "n w"
                                  :fn      #(whiteboard-handler/create-new-whiteboard-and-redirect!)}

   :editor/follow-link           {:binding "mod+o"
                                  :fn      editor-handler/follow-link-under-cursor!}

   :editor/open-link-in-sidebar  {:binding "mod+shift+o"
                                  :fn      editor-handler/open-link-in-sidebar!}

   :editor/bold                  {:binding "mod+b"
                                  :fn      editor-handler/bold-format!}

   :editor/italics               {:binding "mod+i"
                                  :fn      editor-handler/italics-format!}

   :editor/highlight             {:binding "mod+shift+h"
                                  :fn      editor-handler/highlight-format!}

   :editor/strike-through        {:binding "mod+shift+s"
                                  :fn      editor-handler/strike-through-format!}

   :editor/clear-block           {:binding (if mac? "ctrl+l" "alt+l")
                                  :fn      editor-handler/clear-block-content!}

   :editor/kill-line-before      {:binding (if mac? "ctrl+u" "alt+u")
                                  :fn      editor-handler/kill-line-before!}

   :editor/kill-line-after       {:binding (if mac? false "alt+k")
                                  :fn      editor-handler/kill-line-after!}

   :editor/beginning-of-block    {:binding (if mac? false "alt+a")
                                  :fn      editor-handler/beginning-of-block}

   :editor/end-of-block          {:binding (if mac? false "alt+e")
                                  :fn      editor-handler/end-of-block}

   :editor/forward-word          {:binding (if mac? "ctrl+shift+f" "alt+f")
                                  :fn      editor-handler/cursor-forward-word}

   :editor/backward-word         {:binding (if mac? "ctrl+shift+b" "alt+b")
                                  :fn      editor-handler/cursor-backward-word}

   :editor/forward-kill-word     {:binding (if mac? "ctrl+w" "alt+d")
                                  :fn      editor-handler/forward-kill-word}

   :editor/backward-kill-word    {:binding (if mac? false "alt+w")
                                  :fn      editor-handler/backward-kill-word}

   :editor/replace-block-reference-at-point {:binding "mod+shift+r"
                                             :fn      editor-handler/replace-block-reference-with-content-at-point}
   :editor/copy-embed {:binding "mod+e"
                       :fn      editor-handler/copy-current-block-embed}

   :editor/paste-text-in-one-block-at-point {:binding "mod+shift+v"
                                             :fn      (fn [_state e] ((paste-handler/editor-on-paste! nil true) e))}

   :editor/insert-youtube-timestamp         {:binding "mod+shift+y"
                                             :fn      commands/insert-youtube-timestamp}

   :editor/cycle-todo              {:binding "mod+enter"
                                    :fn      editor-handler/cycle-todo!}

   :editor/up                      {:binding ["up" "ctrl+p"]
                                    :fn      (editor-handler/shortcut-up-down :up)}

   :editor/down                    {:binding ["down" "ctrl+n"]
                                    :fn      (editor-handler/shortcut-up-down :down)}

   :editor/left                    {:binding "left"
                                    :fn      (editor-handler/shortcut-left-right :left)}

   :editor/right                   {:binding "right"
                                    :fn      (editor-handler/shortcut-left-right :right)}

   :editor/move-block-up           {:binding (if mac? "mod+shift+up" "alt+shift+up")
                                    :fn      (editor-handler/move-up-down true)}

   :editor/move-block-down         {:binding (if mac? "mod+shift+down" "alt+shift+down")
                                    :fn      (editor-handler/move-up-down false)}

   ;; FIXME: add open edit in non-selection mode
   :editor/open-edit               {:binding "enter"
                                    :fn      (partial editor-handler/open-selected-block! :right)}

   :editor/select-block-up         {:binding "alt+up"
                                    :fn      (editor-handler/on-select-block :up)}

   :editor/select-block-down       {:binding "alt+down"
                                    :fn      (editor-handler/on-select-block :down)}

   :editor/select-up               {:binding "shift+up"
                                    :fn      (editor-handler/shortcut-select-up-down :up)}

   :editor/select-down             {:binding "shift+down"
                                    :fn      (editor-handler/shortcut-select-up-down :down)}

   :editor/delete-selection        {:binding ["backspace" "delete"]
                                    :fn      editor-handler/delete-selection}

   :editor/expand-block-children   {:binding "mod+down"
                                    :fn      editor-handler/expand!}

   :editor/collapse-block-children {:binding "mod+up"
                                    :fn      editor-handler/collapse!}

   :editor/indent                  {:binding "tab"
                                    :fn      (editor-handler/keydown-tab-handler :right)}

   :editor/outdent                 {:binding "shift+tab"
                                    :fn      (editor-handler/keydown-tab-handler :left)}

   :editor/copy                    {:binding "mod+c"
                                    :fn      editor-handler/shortcut-copy}

   :editor/copy-text               {:binding "mod+shift+c"
                                    :fn      editor-handler/shortcut-copy-text}

   :editor/cut                     {:binding "mod+x"
                                    :fn      editor-handler/shortcut-cut}

   :editor/undo                    {:binding "mod+z"
                                    :fn      history/undo!}

   :editor/redo                    {:binding ["shift+mod+z" "mod+y"]
                                    :fn      history/redo!}

   :editor/insert-link             {:binding "mod+l"
                                    :fn      #(editor-handler/html-link-format!)}

   :editor/select-all-blocks       {:binding "mod+shift+a"
                                    :fn      editor-handler/select-all-blocks!}

   :editor/select-parent           {:binding "mod+a"
                                    :fn      editor-handler/select-parent}

   :editor/zoom-in                 {:binding (if mac? "mod+." "alt+right")
                                    :fn      editor-handler/zoom-in!}

   :editor/zoom-out                {:binding (if mac? "mod+," "alt+left")
                                    :fn      editor-handler/zoom-out!}

   :ui/toggle-brackets             {:binding "mod+c mod+b"
                                    :fn      config-handler/toggle-ui-show-brackets!}

   :go/search-in-page              {:binding "mod+shift+k"
                                    :fn      #(do
                                                (editor-handler/escape-editing)
                                                (route-handler/go-to-search! :page))}

   :go/search                      {:binding "mod+k"
                                    :fn      #(do
                                                (editor-handler/escape-editing false)
                                                (route-handler/go-to-search! :global))}

   :go/electron-find-in-page       {:binding "mod+f"
                                    :inactive (not (util/electron?))
                                    :fn      #(search-handler/open-find-in-page!)}

   :go/electron-jump-to-the-next {:binding ["enter" "mod+g"]
                                  :inactive (not (util/electron?))
                                  :fn      #(search-handler/loop-find-in-page! false)}

   :go/electron-jump-to-the-previous {:binding ["shift+enter" "mod+shift+g"]
                                      :inactive (not (util/electron?))
                                      :fn      #(search-handler/loop-find-in-page! true)}

   :go/journals                    {:binding "g j"
                                    :fn      route-handler/go-to-journals!}

   :go/backward                    {:binding "mod+open-square-bracket"
                                    :fn      (fn [_] (js/window.history.back))}

   :go/forward                     {:binding "mod+close-square-bracket"
                                    :fn      (fn [_] (js/window.history.forward))}

   :search/re-index                {:binding "mod+c mod+s"
                                    :fn      (fn [_] (search-handler/rebuild-indices! true))}

   :sidebar/open-today-page        {:binding (if mac? "mod+shift+j" "alt+shift+j")
                                    :fn      page-handler/open-today-in-sidebar}

   :sidebar/close-top              {:binding "c t"
                                    :fn      #(state/sidebar-remove-block! 0)}

   :sidebar/clear                  {:binding "mod+c mod+c"
                                    :fn      #(do
                                                (state/clear-sidebar-blocks!)
                                                (state/hide-right-sidebar!))}

   :misc/copy                      {:binding "mod+c"
                                    :fn      (fn [] (js/document.execCommand "copy"))}

   :command-palette/toggle         {:binding "mod+shift+p"
                                    :fn      #(do
                                                (editor-handler/escape-editing)
                                                (state/pub-event! [:modal/command-palette]))}

   :graph/export-as-html           {:fn #(export-handler/export-repo-as-html!
                                          (state/get-current-repo))
                                    :binding false}

   :graph/open                     {:fn      #(do
                                                (editor-handler/escape-editing)
                                                (state/set-state! :ui/open-select :graph-open))
                                    :binding "alt+shift+g"}

   :graph/remove                   {:fn      #(do
                                                (editor-handler/escape-editing)
                                                (state/set-state! :ui/open-select :graph-remove))
                                    :binding false}

   :graph/add                      {:fn (fn [] (route-handler/redirect! {:to :repo-add}))
                                    :binding false}

   :graph/save                     {:fn #(state/pub-event! [:graph/save])
                                    :binding false}

   :graph/re-index                 {:fn (fn []
                                          (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" (state/get-current-repo))]
                                                 (state/pub-event! [:graph/ask-for-re-index (atom multiple-windows?) nil])))
                                    :binding false}

   :command/run                    {:binding "mod+shift+1"
                                    :inactive (not (util/electron?))
                                    :fn      #(do
                                                (editor-handler/escape-editing)
                                                (state/pub-event! [:command/run]))}

   :go/home                        {:binding "g h"
                                    :fn      route-handler/redirect-to-home!}

   :go/all-pages                   {:binding "g a"
                                    :fn      route-handler/redirect-to-all-pages!}

   :go/graph-view                  {:binding "g g"
                                    :fn      route-handler/redirect-to-graph-view!}

   :go/all-graphs                  {:binding "g shift+g"
                                    :fn      route-handler/redirect-to-all-graphs}

   :go/whiteboards                  {:binding "g w"
                                     :fn      route-handler/redirect-to-whiteboard-dashboard!}

   :go/keyboard-shortcuts          {:binding "g s"
                                    :fn      #(route-handler/redirect! {:to :shortcut-setting})}

   :go/tomorrow                    {:binding "g t"
                                    :fn      journal-handler/go-to-tomorrow!}

   :go/next-journal                {:binding "g n"
                                    :fn      journal-handler/go-to-next-journal!}

   :go/prev-journal                {:binding "g p"
                                    :fn      journal-handler/go-to-prev-journal!}

   :go/flashcards                  {:binding "g f"
                                    :fn      (fn []
                                               (if (state/modal-opened?)
                                                 (state/close-modal!)
                                                 (state/pub-event! [:modal/show-cards])))}

   :ui/toggle-document-mode        {:binding "t d"
                                    :fn      state/toggle-document-mode!}

   :ui/toggle-settings              {:binding (if mac? "t s" ["t s" "mod+,"])
                                     :fn      ui-handler/toggle-settings-modal!}

   :ui/toggle-right-sidebar         {:binding "t r"
                                     :fn      ui-handler/toggle-right-sidebar!}

   :ui/toggle-left-sidebar          {:binding "t l"
                                     :fn      state/toggle-left-sidebar!}

   :ui/toggle-help                  {:binding "shift+/"
                                     :fn      ui-handler/toggle-help!}

   :ui/toggle-theme                 {:binding "t t"
                                     :fn      state/toggle-theme!}

   :ui/toggle-contents              {:binding "alt+shift+c"
                                     :fn      ui-handler/toggle-contents!}

   :command/toggle-favorite         {:binding "mod+shift+f"
                                     :fn      page-handler/toggle-favorite!}

   :editor/open-file-in-default-app {:binding "mod+d mod+a"
                                     :inactive (not (util/electron?))
                                     :fn      page-handler/open-file-in-default-app}

   :editor/open-file-in-directory   {:binding "mod+d mod+i"
                                     :inactive (not (util/electron?))
                                     :fn      page-handler/open-file-in-directory}

   :editor/copy-current-file        {:binding false
                                     :inactive (not (util/electron?))
                                     :fn      page-handler/copy-current-file}

   :ui/toggle-wide-mode             {:binding "t w"
                                     :fn      ui-handler/toggle-wide-mode!}

   :ui/select-theme-color           {:binding "t i"
                                     :fn      plugin-handler/show-themes-modal!}

   :ui/goto-plugins                 {:binding "t p"
                                     :inactive (not config/lsp-enabled?)
                                     :fn      plugin-handler/goto-plugins-dashboard!}

   :ui/install-plugins-from-file    {:binding false
                                     :inactive (not (config/plugin-config-enabled?))
                                     :fn       plugin-config-handler/open-replace-plugins-modal}

   :ui/clear-all-notifications      {:binding false
                                     :fn      :frontend.handler.notification/clear-all!}

   :editor/toggle-open-blocks       {:binding "t o"
                                     :fn      editor-handler/toggle-open!}

   :ui/toggle-cards                 {:binding "t c"
                                     :fn      ui-handler/toggle-cards!}

   :git/commit                      {:binding "mod+g c"
                                     :fn      commit/show-commit-modal!}

   :dev/show-block-data            {:binding false
                                    :inactive (not (state/developer-mode?))
                                    :fn :frontend.handler.common.developer/show-block-data}

   :dev/show-block-ast             {:binding false
                                    :inactive (not (state/developer-mode?))
                                    :fn :frontend.handler.common.developer/show-block-ast}

   :dev/show-page-data             {:binding false
                                    :inactive (not (state/developer-mode?))
                                    :fn :frontend.handler.common.developer/show-page-data}

   :dev/show-page-ast              {:binding false
                                    :inactive (not (state/developer-mode?))
                                    :fn :frontend.handler.common.developer/show-page-ast}})

(let [keyboard-shortcuts
      {::keyboard-shortcuts (set (keys all-default-keyboard-shortcuts))
       ::dicts/keyboard-shortcuts (set (keys dicts/all-default-keyboard-shortcuts))}]
  (assert (= (::keyboard-shortcuts keyboard-shortcuts) (::dicts/keyboard-shortcuts keyboard-shortcuts))
          (str "Keys for keyboard shortcuts must be the same "
               (data/diff (::keyboard-shortcuts keyboard-shortcuts) (::dicts/keyboard-shortcuts keyboard-shortcuts)))))

(defn- resolve-fn
  "Converts a keyword fn to the actual fn. The fn to be resolved needs to be
  marked as ^:export for advanced mode"
  [keyword-fn]
  (fn []
    (if-let [resolved-fn (some-> (find-ns-obj (namespace keyword-fn))
                                 (aget (munge (name keyword-fn))))]
      (resolved-fn)
      (throw (ex-info (str "Unable to resolve " keyword-fn " to a fn") {})))))

(defn build-category-map [ks]
  (->> (select-keys all-default-keyboard-shortcuts ks)
       (remove (comp :inactive val))
       ;; Convert keyword fns to real fns
       (map (fn [[k v]]
              [k (if (keyword? (:fn v))
                   (assoc v :fn (resolve-fn (:fn v)))
                   v)]))
       (into {})))

;; This is the only var that should be publicly expose :fn functionality
(defonce ^:large-vars/data-var config
  (atom
   {:shortcut.handler/date-picker
    (build-category-map [:date-picker/complete
                         :date-picker/prev-day
                         :date-picker/next-day
                         :date-picker/prev-week
                         :date-picker/next-week])

    :shortcut.handler/pdf
    (-> (build-category-map [:pdf/previous-page
                             :pdf/next-page
                             :pdf/close
                             :pdf/find])
        (with-meta {:before m/enable-when-not-editing-mode!}))

    :shortcut.handler/auto-complete
    (build-category-map [:auto-complete/complete
                         :auto-complete/prev
                         :auto-complete/next
                         :auto-complete/shift-complete
                         :auto-complete/open-link])

    :shortcut.handler/cards
    (-> (build-category-map [:cards/toggle-answers
                             :cards/next-card
                             :cards/forgotten
                             :cards/remembered
                             :cards/recall])
        (with-meta {:before m/enable-when-not-editing-mode!}))

    :shortcut.handler/block-editing-only
    (->
     (build-category-map [:editor/escape-editing
                          :editor/backspace
                          :editor/delete
                          :editor/new-block
                          :editor/new-line
                          :editor/follow-link
                          :editor/open-link-in-sidebar
                          :editor/bold
                          :editor/italics
                          :editor/highlight
                          :editor/strike-through
                          :editor/clear-block
                          :editor/kill-line-before
                          :editor/kill-line-after
                          :editor/beginning-of-block
                          :editor/end-of-block
                          :editor/forward-word
                          :editor/backward-word
                          :editor/forward-kill-word
                          :editor/backward-kill-word
                          :editor/replace-block-reference-at-point
                          :editor/copy-embed
                          :editor/paste-text-in-one-block-at-point
                          :editor/insert-youtube-timestamp])
     (with-meta {:before m/enable-when-editing-mode!}))

    :shortcut.handler/editor-global
    (->
     (build-category-map [
                          :graph/export-as-html
                          :graph/open
                          :graph/remove
                          :graph/add
                          :graph/save
                          :graph/re-index
                          :editor/cycle-todo
                          :editor/up
                          :editor/down
                          :editor/left
                          :editor/right
                          :editor/select-up
                          :editor/select-down
                          :editor/move-block-up
                          :editor/move-block-down
                          :editor/open-edit
                          :editor/select-block-up
                          :editor/select-block-down
                          :editor/select-parent
                          :editor/delete-selection
                          :editor/expand-block-children
                          :editor/collapse-block-children
                          :editor/indent
                          :editor/outdent
                          :editor/copy
                          :editor/copy-text
                          :editor/cut
                          :editor/undo
                          :editor/redo
                          :command/toggle-favorite])
     (with-meta {:before m/enable-when-not-component-editing!}))

    :shortcut.handler/global-prevent-default
    (->
     (build-category-map [:editor/insert-link
                          :editor/select-all-blocks
                          :editor/zoom-in
                          :editor/zoom-out
                          :ui/toggle-brackets
                          :go/search-in-page
                          :go/search
                          :go/electron-find-in-page
                          :go/electron-jump-to-the-next
                          :go/electron-jump-to-the-previous
                          :go/backward
                          :go/forward
                          :search/re-index
                          :sidebar/open-today-page
                          :sidebar/clear
                          :command/run
                          :command-palette/toggle])
     (with-meta {:before m/prevent-default-behavior}))

    :shortcut.handler/misc
    ;; always overrides the copy due to "mod+c mod+s"
    {:misc/copy              (:misc/copy              all-default-keyboard-shortcuts)}

    :shortcut.handler/global-non-editing-only
    (->
     (build-category-map [:go/home
                          :go/journals
                          :go/all-pages
                          :go/flashcards
                          :go/graph-view
                          :go/all-graphs
                          :go/whiteboards
                          :go/keyboard-shortcuts
                          :go/tomorrow
                          :go/next-journal
                          :go/prev-journal
                          :ui/toggle-document-mode
                          :ui/toggle-settings
                          :ui/toggle-right-sidebar
                          :ui/toggle-left-sidebar
                          :ui/toggle-help
                          :ui/toggle-theme
                          :ui/toggle-contents
                          :editor/open-file-in-default-app
                          :editor/open-file-in-directory
                          :editor/copy-current-file
                          :editor/new-whiteboard
                          :ui/toggle-wide-mode
                          :ui/select-theme-color
                          :ui/goto-plugins
                          :ui/install-plugins-from-file
                          :editor/toggle-open-blocks
                          :ui/toggle-cards
                          :ui/clear-all-notifications
                          :git/commit
                          :sidebar/close-top
                          :dev/show-block-data
                          :dev/show-block-ast
                          :dev/show-page-data
                          :dev/show-page-ast])
     (with-meta {:before m/enable-when-not-editing-mode!}))}))

;; To add a new entry to this map, first add it here and then
;; a description for it in frontend.modules.shortcut.dicts/category
(def ^:large-vars/data-var category*
  "Full list of categories for docs purpose"
  {:shortcut.category/basics
   [:editor/new-block
    :editor/new-line
    :editor/indent
    :editor/outdent
    :editor/select-all-blocks
    :editor/select-parent
    :go/search
    :go/search-in-page
    :go/electron-find-in-page
    :go/electron-jump-to-the-next
    :go/electron-jump-to-the-previous
    :editor/undo
    :editor/redo
    :editor/copy
    :editor/copy-text
    :editor/cut]

   :shortcut.category/formatting
   [:editor/bold
    :editor/insert-link
    :editor/italics
    :editor/highlight]

   :shortcut.category/navigating
   [:editor/up
    :editor/down
    :editor/left
    :editor/right
    :editor/zoom-in
    :editor/zoom-out
    :editor/collapse-block-children
    :editor/expand-block-children
    :editor/toggle-open-blocks
    :go/backward
    :go/forward
    :go/home
    :go/journals
    :go/all-pages
    :go/graph-view
    :go/all-graphs
    :go/whiteboards
    :go/flashcards
    :go/tomorrow
    :go/next-journal
    :go/prev-journal
    :go/keyboard-shortcuts]

   :shortcut.category/block-editing
   [:editor/backspace
    :editor/delete
    :editor/indent
    :editor/outdent
    :editor/new-block
    :editor/new-line
    :editor/zoom-in
    :editor/zoom-out
    :editor/cycle-todo
    :editor/follow-link
    :editor/open-link-in-sidebar
    :editor/move-block-up
    :editor/move-block-down
    :editor/escape-editing]

   :shortcut.category/block-command-editing
   [:editor/backspace
    :editor/clear-block
    :editor/kill-line-before
    :editor/kill-line-after
    :editor/beginning-of-block
    :editor/end-of-block
    :editor/forward-word
    :editor/backward-word
    :editor/forward-kill-word
    :editor/backward-kill-word
    :editor/replace-block-reference-at-point
    :editor/copy-embed
    :editor/paste-text-in-one-block-at-point
    :editor/select-up
    :editor/select-down]

   :shortcut.category/block-selection
   [:editor/open-edit
    :editor/select-all-blocks
    :editor/select-parent
    :editor/select-block-up
    :editor/select-block-down
    :editor/delete-selection]

   :shortcut.category/toggle
   [:ui/toggle-help
    :editor/toggle-open-blocks
    :ui/toggle-wide-mode
    :ui/toggle-cards
    :ui/toggle-document-mode
    :ui/toggle-brackets
    :ui/toggle-theme
    :ui/toggle-left-sidebar
    :ui/toggle-right-sidebar
    :ui/toggle-settings
    :ui/toggle-contents]

   :shortcut.category/others
   [:pdf/previous-page
    :pdf/next-page
    :pdf/close
    :pdf/find
    :command/toggle-favorite
    :command/run
    :command-palette/toggle
    :graph/export-as-html
    :graph/open
    :graph/remove
    :graph/add
    :graph/save
    :graph/re-index
    :sidebar/close-top
    :sidebar/clear
    :sidebar/open-today-page
    :search/re-index
    :editor/insert-youtube-timestamp
    :editor/open-file-in-default-app
    :editor/open-file-in-directory
    :editor/new-whiteboard
    :auto-complete/prev
    :auto-complete/next
    :auto-complete/complete
    :auto-complete/shift-complete
    :auto-complete/open-link
    :date-picker/prev-day
    :date-picker/next-day
    :date-picker/prev-week
    :date-picker/next-week
    :date-picker/complete
    :git/commit
    :dev/show-block-data
    :dev/show-block-ast
    :dev/show-page-data
    :dev/show-page-ast
    :ui/clear-all-notifications]})

(let [category-maps {::category (set (keys category*))
                     ::dicts/category (set (keys dicts/category))}]
  (assert (= (::category category-maps) (::dicts/category category-maps))
          (str "Keys for category maps must be the same "
               (data/diff (::category category-maps) (::dicts/category category-maps)))))

(def category
  "Active list of categories for docs purpose"
  (update-vals
   category*
   (fn [v]
     (vec (remove #(:inactive (get all-default-keyboard-shortcuts %)) v)))))

(defn add-shortcut!
  [handler-id id shortcut-map]
  (swap! config assoc-in [handler-id id] shortcut-map))

(defn remove-shortcut!
  [handler-id id]
  (swap! config medley/dissoc-in [handler-id id]))
