(ns frontend.state
  "Provides main application state, fns associated to set and state based rum
  cursors"
  (:require [cljs-bean.core :as bean]
            [cljs.core.async :as async :refer [<!]]
            [cljs.spec.alpha :as s]
            [clojure.string :as string]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.mobile.util :as mobile-util]
            [frontend.storage :as storage]
            [frontend.spec.storage :as storage-spec]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.graph-parser.config :as gp-config]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

;; Stores main application state
(defonce ^:large-vars/data-var state
  (let [document-mode? (or (storage/get :document/mode?) false)
        current-graph  (let [graph (storage/get :git/current-repo)]
                        (when graph (ipc/ipc "setCurrentGraph" graph))
                        graph)]
   (atom
    {:route-match                           nil
     :today                                 nil
     :system/events                         (async/chan 1000)
     :db/batch-txs                          (async/chan 1000)
     :file/writes                           (async/chan 10000)
     :file/unlinked-dirs                    #{}
     :reactive/custom-queries               (async/chan 1000)
     :notification/show?                    false
     :notification/content                  nil
     :repo/loading-files?                   {}
     :nfs/user-granted?                     {}
     :nfs/refreshing?                       nil
     :instrument/disabled?                  (storage/get "instrument-disabled")
     ;; TODO: how to detect the network reliably?
     :network/online?         true
     :indexeddb/support?      true
     :me                      nil
     :git/current-repo        current-graph
     :draw?                   false
     :db/restoring?           nil

     :journals-length                       3

     :search/q                              ""
     :search/mode                           :global  ;; inner page or full graph? {:page :global}
     :search/result                         nil
     :search/graph-filters                  []
     :search/engines                        {}

     ;; modals
     :modal/dropdowns                       {}
     :modal/id                              nil
     :modal/label                           ""
     :modal/show?                           false
     :modal/panel-content                   nil
     :modal/fullscreen?                     false
     :modal/close-btn?                      nil
     :modal/close-backdrop?                 true
     :modal/subsets                         []

     ;; ui
     :ui/viewport                           {}

     ;; left sidebar
     :ui/navigation-item-collapsed?         {}

     ;; right sidebar
     :ui/settings-open?                     false
     :ui/sidebar-open?                      false
     :ui/sidebar-width                      "40%"
     :ui/left-sidebar-open?                 (boolean (storage/get "ls-left-sidebar-open?"))
     :ui/theme                              (or (storage/get :ui/theme) "light")
     :ui/system-theme?                      ((fnil identity (or util/mac? util/win32? false)) (storage/get :ui/system-theme?))
     :ui/custom-theme                       (or (storage/get :ui/custom-theme) {:light {:mode "light"} :dark {:mode "dark"}})
     :ui/wide-mode?                         (storage/get :ui/wide-mode)

     ;; ui/collapsed-blocks is to separate the collapse/expand state from db for:
     ;; 1. right sidebar
     ;; 2. zoom-in view
     ;; 3. queries
     ;; 4. references
     ;; graph => {:block-id bool}
     :ui/collapsed-blocks                   {}
     :ui/sidebar-collapsed-blocks           {}
     :ui/root-component                     nil
     :ui/file-component                     nil
     :ui/developer-mode?                    (or (= (storage/get "developer-mode") "true")
                                                false)
     ;; remember scroll positions of visited paths
     :ui/paths-scroll-positions             {}
     :ui/shortcut-tooltip?                  (if (false? (storage/get :ui/shortcut-tooltip?))
                                              false
                                              true)
     :ui/scrolling?                         false
     :document/mode?                        document-mode?

     :config                                {}
     :block/component-editing-mode?         false
     :editor/op                             nil
     :editor/latest-op                      nil
     :editor/hidden-editors                 #{}             ;; page names
     :editor/draw-mode?                     false
     :editor/action                         nil
     :editor/action-data                    nil
     ;; With label or other data
     :editor/last-saved-cursor              nil
     :editor/editing?                       nil
     :editor/in-composition?                false
     :editor/content                        {}
     :editor/block                          nil
     :editor/block-dom-id                   nil
     :editor/set-timestamp-block            nil             ;; click rendered block timestamp-cp to set timestamp
     :editor/last-input-time                nil
     :editor/document-mode?                 document-mode?
     :editor/args                           nil
     :editor/on-paste?                      false
     :editor/last-key-code                  nil

     ;; Stores deleted refed blocks, indexed by repo
     :editor/last-replace-ref-content-tx    nil

     ;; for audio record
     :editor/record-status                  "NONE"

     ;; Whether to skip saving the current block
     :editor/skip-saving-current-block?     false

     :editor/code-block-context             {}

     :db/last-transact-time                 {}
     ;; whether database is persisted
     :db/persisted?                         {}

     :cursor-range                          nil

     :selection/mode                        false
     ;; Warning: blocks order is determined when setting this attribute
     :selection/blocks                      []
     :selection/start-block                 nil
     ;; either :up or :down, defaults to down
     ;; used to determine selection direction when two or more blocks are selected
     :selection/direction                   :down
     :selection/selected-all?               false
     :custom-context-menu/show?             false
     :custom-context-menu/links             nil
     :custom-context-menu/position          nil

     ;; pages or blocks in the right sidebar
     ;; It is a list of `[repo db-id block-type block-data]` 4-tuple
     :sidebar/blocks                        '()

     :preferred-language                    (storage/get :preferred-language)

     ;; electron
     :electron/auto-updater-downloaded      false
     :electron/updater-pending?             false
     :electron/updater                      {}
     :electron/user-cfgs                    nil
     :electron/server                       nil
     :electron/window-maximized?            false
     :electron/window-fullscreen?           false

     ;; assets
     :assets/alias-enabled?                 (or (storage/get :assets/alias-enabled?) false)
     :assets/alias-dirs                     (or (storage/get :assets/alias-dirs) [])

     ;; mobile
     :mobile/container-urls                 nil
     :mobile/show-action-bar?               false
     :mobile/actioned-block                 nil
     :mobile/show-toolbar?                  false
     :mobile/show-recording-bar?            false
     :mobile/show-tabbar?                   false
     ;;; Used to monitor mobile app status,
     ;;; value spec:
     ;;; {:is-active? bool, :timestamp int}
     :mobile/app-state-change                 (atom nil)

     ;; plugin
     :plugin/enabled                        (and (util/electron?)
                                                 ;; true false :theme-only
                                                 ((fnil identity true) (storage/get ::storage-spec/lsp-core-enabled)))
     :plugin/preferences                    nil
     :plugin/indicator-text                 nil
     :plugin/installed-plugins              {}
     :plugin/installed-themes               []
     :plugin/installed-slash-commands       {}
     :plugin/installed-ui-items             {}
     :plugin/installed-resources            {}
     :plugin/installed-hooks                {}
     :plugin/installed-services             {}
     :plugin/simple-commands                {}
     :plugin/selected-theme                 nil
     :plugin/selected-unpacked-pkg          nil
     :plugin/marketplace-pkgs               nil
     :plugin/marketplace-stats              nil
     :plugin/installing                     nil
     :plugin/active-readme                  nil
     :plugin/updates-auto-checking?         false
     :plugin/updates-pending                {}
     :plugin/updates-coming                 {}
     :plugin/updates-downloading?           false
     :plugin/updates-unchecked              #{}
     :plugin/navs-settings?                 true
     :plugin/focused-settings               nil ;; plugin id

     ;; pdf
     :pdf/system-win?                       false
     :pdf/current                           nil
     :pdf/ref-highlight                     nil
     :pdf/block-highlight-colored?          (or (storage/get "ls-pdf-hl-block-is-colored") true)

     ;; all notification contents as k-v pairs
     :notification/contents                 {}
     :graph/syncing?                        false
     ;; graph -> state
     :graph/parsing-state                   {}

     :copy/export-block-text-indent-style   (or (storage/get :copy/export-block-text-indent-style)
                                                "dashes")
     :copy/export-block-text-remove-options (or (storage/get :copy/export-block-text-remove-options)
                                                #{})
     :copy/export-block-text-other-options  (or (storage/get :copy/export-block-text-other-options)
                                                {})
     :date-picker/date                      nil

     :youtube/players                       {}

     ;; command palette
     :command-palette/commands              []

     :view/components                       {}

     :favorites/dragging                    nil

     :srs/mode?                             false

     :srs/cards-due-count                   nil

     :reactive/query-dbs                    {}

     ;; login, userinfo, token, ...
     :auth/refresh-token                    (storage/get "refresh-token")
     :auth/access-token                     nil
     :auth/id-token                         nil

     ;; file-sync
     :file-sync/jstour-inst                   nil
     :file-sync/onboarding-state            (or (storage/get :file-sync/onboarding-state)
                                                {:welcome false})
     :file-sync/remote-graphs               {:loading false :graphs nil}
     :file-sync/set-remote-graph-password-result {}

     ;; graph-uuid -> {:graphs-txid {}
     ;;                :file-sync/sync-manager {}
     ;;                :file-sync/sync-state {}
     ;;                ;; {file-path -> payload}
     ;;                :file-sync/progress {}
     ;;                :file-sync/start-time {}
     ;;                :file-sync/last-synced-at {}}
     :file-sync/graph-state                 {:current-graph-uuid nil}
                                             ;; graph-uuid -> ...

     :user/info                             {:UserGroups (storage/get :user-groups)}
     :encryption/graph-parsing?             false

     :ui/loading?                           {}
     :feature/enable-sync?                  (storage/get :logseq-sync-enabled)

     :file/rename-event-chan                (async/chan 100)
     :ui/find-in-page                       nil
     :graph/importing                       nil
     :graph/importing-state                 {}

     :whiteboard/onboarding-whiteboard?     (or (storage/get :ls-onboarding-whiteboard?) false)
     :whiteboard/onboarding-tour?           (or (storage/get :whiteboard-onboarding-tour?) false)
     :whiteboard/last-persisted-at          {}
     :whiteboard/pending-tx-data            {}
     :history/page-only-mode?               false
     ;; db tx-id -> editor cursor
     :history/tx->editor-cursor             {}})))

;; Block ast state
;; ===============

;; block uuid -> {content(String) -> ast}
(def blocks-ast-cache (atom {}))
(defn add-block-ast-cache!
  [block-uuid content ast]
  (when (and block-uuid content ast)
    (let [new-value (assoc-in @blocks-ast-cache [block-uuid content] ast)
          new-value (if (> (count new-value) 10000)
                      (into {} (take 5000 new-value))
                      new-value)]
      (reset! blocks-ast-cache new-value))))

(defn get-block-ast
  [block-uuid content]
  (when (and block-uuid content)
    (get-in @blocks-ast-cache [block-uuid content])))

;; User configuration getters under :config (and sometimes :me)
;; ========================================
;; TODO: Refactor default config values to be data driven. Currently they are all
;;  buried in getters
;; TODO: Refactor our access to be more data driven. Currently each getter
;;  (re-)fetches get-current-repo needlessly
;; TODO: Add consistent validation. Only a few config options validate at get time

(def default-config
  "Default config for a repo-specific, user config"
  {:feature/enable-search-remove-accents? true
   :default-arweave-gateway "https://arweave.net"
   :ui/auto-expand-block-refs? true

   ;; For flushing the settings of old versions. Don't bump this value.
   ;; There are only two kinds of graph, one is not upgraded (:legacy) and one is upgraded (:triple-lowbar)
   ;; For not upgraded graphs, the config will have no key `:file/name-format`
   ;; Then the default value is applied
   :file/name-format :legacy})

;; State that most user config is dependent on
(declare get-current-repo sub set-state!)

(defn merge-configs
  "Merges user configs in given orders. All values are overridden except for maps
  which are merged."
  [& configs]
  (->> configs
       (filter map?)
       (apply merge-with
         (fn merge-config [current new]
           (if (and (map? current) (map? new))
             (merge current new)
             new)))))

(defn get-config
  "User config for the given repo or current repo if none given. All config fetching
should be done through this fn in order to get global config and config defaults"
  ([]
   (get-config (get-current-repo)))
  ([repo-url]
   (merge-configs
    default-config
    (get-in @state [:config ::global-config])
    (get-in @state [:config repo-url]))))

(defonce publishing? (atom nil))

(defn publishing-enable-editing?
  []
  (and @publishing? (:publishing/enable-editing? (get-config))))

(defn enable-editing?
  []
  (or (not @publishing?) (:publishing/enable-editing? (get-config))))

(defn get-arweave-gateway
  []
  (:arweave/gateway (get-config)))

(defonce built-in-macros
         {"img" "[:img.$4 {:src \"$1\" :style {:width $2 :height $3}}]"})

(defn get-macros
  []
  (merge
    built-in-macros
    (:macros (get-config))))

(defn set-assets-alias-enabled!
  [v]
  (set-state! :assets/alias-enabled? (boolean v))
  (storage/set :assets/alias-enabled? (boolean v)))

(defn set-assets-alias-dirs!
  [dirs]
  (when dirs
    (set-state! :assets/alias-dirs dirs)
    (storage/set :assets/alias-dirs dirs)))

(defn get-custom-css-link
  []
  (:custom-css-url (get-config)))

(defn get-custom-js-link
  []
  (:custom-js-url (get-config)))

(defn get-default-journal-template
  []
  (when-let [template (get-in (get-config) [:default-templates :journals])]
    (when-not (string/blank? template)
      (string/trim template))))

(defn all-pages-public?
  []
  (let [value (:publishing/all-pages-public? (get-config))
        value (if (some? value) value (:all-pages-public? (get-config)))]
    (true? value)))

(defn get-default-home
  []
  (:default-home (get-config)))

(defn custom-home-page?
  []
  (some? (:page (get-default-home))))

(defn get-preferred-format
  ([]
   (get-preferred-format (get-current-repo)))
  ([repo-url]
   (keyword
     (or
       (when-let [fmt (:preferred-format (get-config repo-url))]
         (string/lower-case (name fmt)))

       (get-in @state [:me :preferred_format] "markdown")))))

(defn markdown?
  []
  (= (keyword (get-preferred-format))
     :markdown))

(defn get-pages-directory
  []
  (or
    (when-let [repo (get-current-repo)]
      (:pages-directory (get-config repo)))
    "pages"))

(defn get-journals-directory
  []
  (or
    (when-let [repo (get-current-repo)]
      (:journals-directory (get-config repo)))
    "journals"))

(defn get-whiteboards-directory
  []
  (or
   (when-let [repo (get-current-repo)]
     (:whiteboards-directory (get-config repo)))
   "whiteboards"))

(defn org-mode-file-link?
  [repo]
  (:org-mode/insert-file-link? (get-config repo)))

(defn get-journal-file-name-format
  []
  (when-let [repo (get-current-repo)]
    (:journal/file-name-format (get-config repo))))

(defn get-preferred-workflow
  []
  (keyword
    (or
      (when-let [workflow (:preferred-workflow (get-config))]
        (let [workflow (name workflow)]
          (if (util/safe-re-find #"now|NOW" workflow)
            :now
            :todo)))
      (get-in @state [:me :preferred_workflow] :now))))

(defn get-preferred-todo
  []
  (if (= (get-preferred-workflow) :now)
    "LATER"
    "TODO"))

(defn get-filename-format
  ([] (get-filename-format (get-current-repo)))
  ([repo]
   (:file/name-format (get-config repo))))

(defn get-date-formatter
  []
  (gp-config/get-date-formatter (get-config)))

(defn shortcuts []
  (:shortcuts (get-config)))

(defn get-commands
  []
  (:commands (get-config)))

(defn get-scheduled-future-days
  []
  (let [days (:scheduled/future-days (get-config))]
    (or (when (int? days) days) 7)))

(defn get-start-of-week
  []
  (or (:start-of-week (get-config))
      (get-in @state [:me :settings :start-of-week])
      6))

(defn get-ref-open-blocks-level
  []
  (or
    (when-let [value (:ref/default-open-blocks-level (get-config))]
      (when (integer? value)
        value))
    2))

(defn get-linked-references-collapsed-threshold
  []
  (or
    (when-let [value (:ref/linked-references-collapsed-threshold (get-config))]
      (when (integer? value)
        value))
    100))

(defn get-export-bullet-indentation
  []
  (case (get (get-config) :export/bullet-indentation :tab)
    :eight-spaces
    "        "
    :four-spaces
    "    "
    :two-spaces
    "  "
    :tab
    "\t"))

(defn enable-search-remove-accents?
  []
  (:feature/enable-search-remove-accents? (get-config)))

;; State cursor fns for use with rum components
;; ============================================

(declare document-mode?)

(defn sub
  "Creates a rum cursor, https://github.com/tonsky/rum#cursors, for use in rum components.
Similar to re-frame subscriptions"
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

(defn sub-config
  "Sub equivalent to get-config which should handle all sub user-config access"
  ([] (sub-config (get-current-repo)))
  ([repo]
   (let [config (sub :config)]
     (merge-configs default-config
                    (get config ::global-config)
                    (get config repo)))))

(defn enable-grammarly?
  []
  (true? (:feature/enable-grammarly? (sub-config))))

(defn scheduled-deadlines-disabled?
  []
  (true? (:feature/disable-scheduled-and-deadline-query? (sub-config))))

(defn enable-timetracking?
  []
  (not (false? (:feature/enable-timetracking? (sub-config)))))

(defn enable-fold-button-right?
  []
  (let [_ (sub :ui/viewport)]
    (and (util/mobile?)
         (util/sm-breakpoint?))))

(defn enable-journals?
  ([]
   (enable-journals? (get-current-repo)))
  ([repo]
   (not (false? (:feature/enable-journals? (sub-config repo))))))

(defn enable-flashcards?
  ([]
   (enable-flashcards? (get-current-repo)))
  ([repo]
   (not (false? (:feature/enable-flashcards? (sub-config repo))))))

(defn enable-sync?
  []
  (sub :feature/enable-sync?))

(defn enable-whiteboards?
  ([]
   (enable-whiteboards? (get-current-repo)))
  ([repo]
   (not (false? (:feature/enable-whiteboards? (sub-config repo))))))

(defn enable-git-auto-push?
  [repo]
  (not (false? (:git-auto-push (sub-config repo)))))

(defn enable-block-timestamps?
  []
  (true? (:feature/enable-block-timestamps? (sub-config))))

(defn graph-settings
  []
  (:graph/settings (sub-config)))

;; Enable by default
(defn show-brackets?
  []
  (not (false? (:ui/show-brackets? (sub-config)))))

(defn sub-default-home-page
  []
  (get-in (sub-config) [:default-home :page] ""))

(defn sub-edit-content
  [id]
  (sub [:editor/content id]))

(defn- get-selected-block-ids
  [blocks]
  (->> blocks
       (remove nil?)
       (keep #(when-let [id (dom/attr % "blockid")]
                (uuid id)))
       (distinct)))

(defn sub-block-selected?
  [container-id block-uuid]
  (rum/react
   (rum/derived-atom [state] [::select-block container-id block-uuid]
     (fn [state]
       (contains? (set (get-selected-block-ids (:selection/blocks state)))
                  block-uuid)))))

(defn block-content-max-length
  [repo]
  (or (:block/content-max-length (sub-config repo)) 10000))

(defn mobile?
  []
  (or (util/mobile?) (mobile-util/native-platform?)))

(defn enable-tooltip?
  []
  (if (mobile?)
    false
    (get (sub-config) :ui/enable-tooltip? true)))

(defn show-command-doc?
  []
  (get (sub-config) :ui/show-command-doc? true))

(defn logical-outdenting?
  []
  (:editor/logical-outdenting? (sub-config)))

(defn show-full-blocks?
  []
  (:ui/show-full-blocks? (sub-config)))

(defn preferred-pasting-file?
  []
  (:editor/preferred-pasting-file? (sub-config)))

(defn auto-expand-block-refs?
  []
  (:ui/auto-expand-block-refs? (sub-config)))

(defn doc-mode-enter-for-new-line?
  []
  (and (document-mode?)
       (not (:shortcut/doc-mode-enter-for-new-block? (get-config)))))

(defn user-groups
  []
  (set (sub [:user/info :UserGroups])))

;; State mutation helpers
;; ======================

(defn set-state!
  [path value]
  (if (vector? path)
    (swap! state assoc-in path value)
    (swap! state assoc path value))
  nil)

(defn update-state!
  [path f]
  (if (vector? path)
    (swap! state update-in path f)
    (swap! state update path f))
  nil)

;; State getters and setters
;; =========================
;; These fns handle any key except :config.
;; Some state is also stored in local storage and/or sent to electron's main process

(defn get-route-match
  []
  (:route-match @state))

(defn get-current-route
  []
  (get-in (get-route-match) [:data :name]))

(defn home?
  []
  (= :home (get-current-route)))

(defn whiteboard-dashboard?
  []
  (= :whiteboards (get-current-route)))

(defn setups-picker?
  []
  (= :repo-add (get-current-route)))

(defn get-current-page
  []
  (when (= :page (get-current-route))
    (get-in (get-route-match)
            [:path-params :name])))

(defn whiteboard-route?
  []
  (= :whiteboard (get-current-route)))

(defn get-current-whiteboard
  []
  (when (whiteboard-route?)
    (get-in (get-route-match)
            [:path-params :name])))

(defn route-has-p?
  []
  (get-in (get-route-match) [:query-params :p]))

(defn get-current-repo
  "Returns the current repo URL, or else open demo graph"
  []
  (or (:git/current-repo @state)
      "local"))

(defn get-remote-graphs
  []
  (get-in @state [:file-sync/remote-graphs :graphs]))

(defn get-remote-graph-info-by-uuid
  [uuid]
  (when-let [graphs (seq (get-in @state [:file-sync/remote-graphs :graphs]))]
    (some #(when (= (:GraphUUID %) (str uuid)) %) graphs)))

(defn get-remote-graph-usage 
  []
  (when-let [graphs (seq (get-in @state [:file-sync/remote-graphs :graphs]))]
    (->> graphs
         (map #(hash-map :uuid (:GraphUUID %)
                         :name (:GraphName %)
                         :used-gbs (/ (:GraphStorageUsage %) 1024 1024 1024)
                         :limit-gbs (/ (:GraphStorageLimit %) 1024 1024 1024)
                         :used-percent (/ (:GraphStorageUsage %) (:GraphStorageLimit %) 0.01)))
         (map #(assoc % :free-gbs (- (:limit-gbs %) (:used-gbs %))))
         (vec))))

(defn delete-remote-graph!
  [repo]
  (swap! state update-in [:file-sync/remote-graphs :graphs]
         (fn [repos]
           (remove #(and
                     (:GraphUUID repo)
                     (:GraphUUID %)
                     (= (:GraphUUID repo) (:GraphUUID %))) repos))))

(defn add-remote-graph!
  [repo]
  (swap! state update-in [:file-sync/remote-graphs :graphs]
         (fn [repos]
           (->> (conj repos repo)
                (distinct)))))

(defn get-repos
  []
  (get-in @state [:me :repos]))

(defn set-repos!
  [repos]
  (set-state! [:me :repos] repos))

(defn add-repo!
  [repo]
  (when (not (string/blank? repo))
    (update-state! [:me :repos]
                   (fn [repos]
                     (->> (conj repos repo)
                          (distinct))))))

(defn set-current-repo!
  [repo]
  (swap! state assoc :git/current-repo repo)
  (if repo
    (storage/set :git/current-repo repo)
    (storage/remove :git/current-repo))
  (ipc/ipc "setCurrentGraph" repo))

(defn set-preferred-format!
  [format]
  (swap! state assoc-in [:me :preferred_format] (name format)))

(defn set-preferred-workflow!
  [workflow]
  (swap! state assoc-in [:me :preferred_workflow] (name workflow)))

(defn set-preferred-language!
  [language]
  (set-state! :preferred-language (name language))
  (storage/set :preferred-language (name language)))

(defn delete-repo!
  [repo]
  (swap! state update-in [:me :repos]
         (fn [repos]
           (->> (remove #(or (= (:url repo) (:url %))
                             (and
                              (:GraphUUID repo)
                              (:GraphUUID %)
                              (= (:GraphUUID repo) (:GraphUUID %)))) repos)
                (util/distinct-by :url)))))

(defn set-timestamp-block!
  [value]
  (set-state! :editor/set-timestamp-block value))

(defn get-timestamp-block
  []
  (:editor/set-timestamp-block @state))

(defn set-edit-content!
  ([input-id value] (set-edit-content! input-id value true))
  ([input-id value set-input-value?]
   (when input-id
     (when set-input-value?
       (when-let [input (gdom/getElement input-id)]
         (util/set-change-value input value)))
     (update-state! :editor/content (fn [m]
                                      (assoc m input-id value))))))

(defn get-edit-input-id
  []
  (ffirst (:editor/editing? @state)))

(defn get-input
  []
  (when-let [id (get-edit-input-id)]
    (gdom/getElement id)))

(defn editing?
  []
  (let [input (get-input)]
    (and input (= input (.-activeElement js/document)))))

(defn get-edit-content
  []
  (get (:editor/content @state) (get-edit-input-id)))

(defn get-cursor-range
  []
  (:cursor-range @state))

(defn set-cursor-range!
  [range]
  (set-state! :cursor-range range))

(defn set-q!
  [value]
  (set-state! :search/q value))

(defn set-search-mode!
  [value]
  (set-state! :search/mode value))

(defn set-editor-action!
  [value]
  (set-state! :editor/action value))

(defn set-editor-action-data!
  [value]
  (set-state! :editor/action-data value))

(defn get-editor-action
  []
  (:editor/action @state))

(defn get-editor-action-data
  []
  (:editor/action-data @state))

(defn get-editor-show-page-search?
  []
  (= (get-editor-action) :page-search))

(defn get-editor-show-page-search-hashtag?
  []
  (= (get-editor-action) :page-search-hashtag))

(defn get-editor-show-block-search?
  []
  (= (get-editor-action) :block-search))

(defn set-editor-show-input!
  [value]
  (if value
    (do
      (set-editor-action-data! (assoc (get-editor-action-data) :options value))
      (set-editor-action! :input))
    (do
      (set-editor-action! nil)
      (set-editor-action-data! nil))))

(defn get-editor-show-input
  []
  (when (= (get-editor-action) :input)
    (get @state :editor/action-data)))

(defn set-editor-show-commands!
  []
  (when-not (get-editor-action) (set-editor-action! :commands)))

(defn set-editor-show-block-commands!
  []
  (when-not (get-editor-action) (set-editor-action! :block-commands)))

(defn clear-editor-action!
  []
  (swap! state (fn [state]
                 (assoc state :editor/action nil))))

(defn set-edit-input-id!
  [input-id]
  (swap! state update :editor/editing?
         (fn [_m]
           (and input-id {input-id true}))))

(defn get-edit-pos
  []
  (when-let [input (get-input)]
    (util/get-selection-start input)))

(defn get-selection-start-block
  []
  (get @state :selection/start-block))

(defn set-selection-start-block!
  [start-block]
  (when-not (get-selection-start-block)
    (swap! state assoc :selection/start-block start-block)))

(defn set-selection-blocks!
  ([blocks]
   (set-selection-blocks! blocks :down))
  ([blocks direction]
   (when (seq blocks)
     (let [blocks (util/sort-by-height (remove nil? blocks))]
       (swap! state assoc
             :selection/mode true
             :selection/blocks blocks
             :selection/direction direction)))))

(defn into-selection-mode!
  []
  (swap! state assoc :selection/mode true))

(defn clear-selection!
  []
  (swap! state assoc
         :selection/mode false
         :selection/blocks nil
         :selection/direction :down
         :selection/start-block nil
         :selection/selected-all? false))

(defn get-selection-blocks
  []
  (->> (:selection/blocks @state)
       (remove nil?)))

(defn get-selection-block-ids
  []
  (get-selected-block-ids (get-selection-blocks)))

(defn get-selection-start-block-or-first
  []
  (or (get-selection-start-block)
      (some-> (first (get-selection-blocks))
              (gobj/get "id"))))

(defn in-selection-mode?
  []
  (:selection/mode @state))

(defn selection?
  "True sense of selection mode with valid selected block"
  []
  (and (in-selection-mode?) (seq (get-selection-blocks))))

(defn conj-selection-block!
  [block direction]
  (swap! state assoc
         :selection/mode true
         :selection/blocks (-> (conj (vec (:selection/blocks @state)) block)
                               (util/sort-by-height))
         :selection/direction direction))

(defn drop-last-selection-block!
  []
  (let [direction (:selection/direction @state)
        up? (= direction :up)
        blocks (:selection/blocks @state)
        last-block (if up?
                     (first blocks)
                     (peek (vec blocks)))
        blocks' (if up?
                  (rest blocks)
                  (pop (vec blocks)))]
    (swap! state assoc
           :selection/mode true
           :selection/blocks blocks')
    last-block))

(defn get-selection-direction
  []
  (:selection/direction @state))

(defn show-custom-context-menu!
  [links position]
  (swap! state assoc
         :custom-context-menu/show? true
         :custom-context-menu/links links
         :custom-context-menu/position position))

(defn hide-custom-context-menu!
  []
  (swap! state assoc
         :custom-context-menu/show? false
         :custom-context-menu/links nil
         :custom-context-menu/position nil))

(defn toggle-navigation-item-collapsed!
  [item]
  (update-state! [:ui/navigation-item-collapsed? item] not))

(defn toggle-sidebar-open?!
  []
  (swap! state update :ui/sidebar-open? not))

(defn open-right-sidebar!
  []
  (swap! state assoc :ui/sidebar-open? true))

(defn hide-right-sidebar!
  []
  (swap! state assoc :ui/sidebar-open? false))

(defn sidebar-add-block!
  [repo db-id block-type]
  (when (not (util/sm-breakpoint?))
    (when db-id
      (update-state! :sidebar/blocks (fn [blocks]
                                       (->> (remove #(= (second %) db-id) blocks)
                                            (cons [repo db-id block-type])
                                            (distinct))))
      (open-right-sidebar!)
      (when-let [elem (gdom/getElementByClass "sidebar-item-list")]
        (util/scroll-to elem 0)))))

(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (if (string? idx)
                                     (remove #(= (second %) idx) blocks)
                                     (util/drop-nth idx blocks))))
  (when (empty? (:sidebar/blocks @state))
    (hide-right-sidebar!)))

(defn sidebar-replace-block!
  [old-sidebar-key new-sidebar-key]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (map #(if (= % old-sidebar-key)
                                           new-sidebar-key
                                           %) blocks))))

(defn sidebar-block-exists?
  [idx]
  (some #(= (second %) idx) (:sidebar/blocks @state)))

(defn clear-sidebar-blocks!
  []
  (set-state! :sidebar/blocks '()))

(defn sidebar-block-toggle-collapse!
  [db-id]
  (when db-id
    (update-state! [:ui/sidebar-collapsed-blocks db-id] not)))

(defn get-edit-block
  []
  (get @state :editor/block))

(defn get-current-edit-block-and-position
  []
  (let [edit-input-id (get-edit-input-id)
        edit-block (get-edit-block)
        block-element (when edit-input-id (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block")))
        container (when block-element
                    (util/get-block-container block-element))]
    (when container
      {:last-edit-block edit-block
       :container       (gobj/get container "id")
       :pos             (or (cursor/pos (gdom/getElement edit-input-id))
                            (count (:block/content edit-block)))})))

(defn clear-edit!
  []
  (swap! state merge {:editor/editing? nil
                      :editor/block    nil
                      :cursor-range    nil
                      :editor/last-saved-cursor nil}))

(defn into-code-editor-mode!
  []
  (swap! state merge {:editor/editing?   nil
                      :cursor-range      nil
                      :editor/code-mode? true}))

(defn set-editor-last-pos!
  [new-pos]
  (set-state! [:editor/last-saved-cursor (:block/uuid (get-edit-block))] new-pos))

(defn clear-editor-last-pos!
  []
  (set-state! :editor/last-saved-cursor nil))

(defn get-editor-last-pos
  []
  (get-in @state [:editor/last-saved-cursor (:block/uuid (get-edit-block))]))

(defn set-block-content-and-last-pos!
  [edit-input-id content new-pos]
  (when edit-input-id
    (set-edit-content! edit-input-id content)
    (set-state! [:editor/last-saved-cursor (:block/uuid (get-edit-block))] new-pos)))

(defn set-theme-mode!
  [mode]
  (when (mobile-util/native-platform?)
    (if (= mode "light")
      (util/set-theme-light)
      (util/set-theme-dark)))
  (set-state! :ui/theme mode)
  (storage/set :ui/theme mode))

(defn sync-system-theme!
  []
  (let [system-dark? (.-matches (js/window.matchMedia "(prefers-color-scheme: dark)"))]
    (set-theme-mode! (if system-dark? "dark" "light"))
    (set-state! :ui/system-theme? true)
    (storage/set :ui/system-theme? true)))

(defn use-theme-mode!
  [theme-mode]
  (if (= theme-mode "system")
    (sync-system-theme!)
    (do
      (set-theme-mode! theme-mode)
      (set-state! :ui/system-theme? false)
      (storage/set :ui/system-theme? false))))

(defn- toggle-theme
  [theme]
  (if (= theme "dark") "light" "dark"))

(defn toggle-theme!
  []
  (use-theme-mode! (toggle-theme (:ui/theme @state))))

(defn set-custom-theme!
  ([custom-theme]
   (set-custom-theme! nil custom-theme))
  ([mode theme]
   (set-state! (if mode [:ui/custom-theme (keyword mode)] :ui/custom-theme) theme)
   (storage/set :ui/custom-theme (:ui/custom-theme @state))))

(defn restore-mobile-theme!
  "Restore mobile theme setting from local storage"
  []
  (let [mode (or (storage/get :ui/theme) "light")
        system-theme? (storage/get :ui/system-theme?)]
    (when (and (not system-theme?)
               (mobile-util/native-platform?))
      (if (= mode "light")
        (util/set-theme-light)
        (util/set-theme-dark)))))

(defn set-editing-block-dom-id!
  [block-dom-id]
  (set-state! :editor/block-dom-id block-dom-id))

(defn get-editing-block-dom-id
  []
  (:editor/block-dom-id @state))

(defn set-root-component!
  [component]
  (set-state! :ui/root-component component))

(defn get-root-component
  []
  (get @state :ui/root-component))

(defn load-app-user-cfgs
  ([] (load-app-user-cfgs false))
  ([refresh?]
   (when (util/electron?)
     (p/let [cfgs (if (or refresh? (nil? (:electron/user-cfgs @state)))
                    (ipc/ipc :userAppCfgs)
                    (:electron/user-cfgs @state))
             cfgs (if (object? cfgs) (bean/->clj cfgs) cfgs)]
       (set-state! :electron/user-cfgs cfgs)))))

(defn setup-electron-updater!
  []
  (when (util/electron?)
    (js/window.apis.setUpdatesCallback
      (fn [_ args]
        (let [data (bean/->clj args)
              pending? (not= (:type data) "completed")]
          (set-state! :electron/updater-pending? pending?)
          (when pending? (set-state! :electron/updater data))
          nil)))))

(defn set-file-component!
  [component]
  (set-state! :ui/file-component component))

(defn clear-file-component!
  []
  (set-state! :ui/file-component nil))

(defn set-journals-length!
  [value]
  (when value
    (set-state! :journals-length value)))

(defn save-scroll-position!
  ([value]
   (save-scroll-position! value js/window.location.hash))
  ([value path]
   (set-state! [:ui/paths-scroll-positions path] value)))

(defn get-saved-scroll-position
  ([]
   (get-saved-scroll-position js/window.location.hash))
  ([path]
   (get-in @state [:ui/paths-scroll-positions path] 0)))

(defn set-today!
  [value]
  (set-state! :today value))

(defn get-me
  []
  (:me @state))

(defn set-db-restoring!
  [value]
  (set-state! :db/restoring? value))

(defn set-indexedb-support!
  [value]
  (set-state! :indexeddb/support? value))

(defn modal-opened?
  []
  (:modal/show? @state))

(declare set-modal!)
(declare close-modal!)

(defn get-sub-modals
  []
  (:modal/subsets @state))

(defn set-sub-modal!
  ([panel-content]
   (set-sub-modal! panel-content
                   {:close-btn? true}))
  ([panel-content {:keys [id label close-btn? close-backdrop? show? center?] :as opts}]
   (if (not (modal-opened?))
     (set-modal! panel-content opts)
     (let [modals (:modal/subsets @state)
           idx (and id (first (keep-indexed #(when (= (:modal/id %2) id) %1)
                                            modals)))
           input (medley/filter-vals
                   #(not (nil? %1))
                   {:modal/id            id
                    :modal/label         (or label (if center? "ls-modal-align-center" ""))
                    :modal/show?         (if (boolean? show?) show? true)
                    :modal/panel-content panel-content
                    :modal/close-btn?    close-btn?
                    :modal/close-backdrop? (if (boolean? close-backdrop?) close-backdrop? true)})]
       (swap! state update-in
              [:modal/subsets (or idx (count modals))]
              merge input)
       (:modal/subsets @state)))))

(defn close-sub-modal!
  ([] (close-sub-modal! nil))
  ([all?-a-id]
   (if (true? all?-a-id)
     (swap! state assoc :modal/subsets [])
     (let [id     all?-a-id
           mid    (:modal/id @state)
           modals (:modal/subsets @state)]
       (if (and id (not (string/blank? mid)) (= id mid))
         (close-modal!)
         (when-let [idx (if id (first (keep-indexed #(when (= (:modal/id %2) id) %1) modals))
                          (dec (count modals)))]
           (swap! state assoc :modal/subsets (into [] (medley/remove-nth idx modals)))))))
   (:modal/subsets @state)))

(defn set-modal!
  ([modal-panel-content]
   (set-modal! modal-panel-content
               {:fullscreen? false
                :close-btn?  true}))
  ([modal-panel-content {:keys [id label fullscreen? close-btn? close-backdrop? center?]}]
   (let [opened? (modal-opened?)]
     (when opened?
       (close-modal!))
     (when (seq (get-sub-modals))
       (close-sub-modal! true))

     (async/go
       (when opened?
         (<! (async/timeout 100)))
       (swap! state assoc
              :modal/id id
              :modal/label (or label (if center? "ls-modal-align-center" ""))
              :modal/show? (boolean modal-panel-content)
              :modal/panel-content modal-panel-content
              :modal/fullscreen? fullscreen?
              :modal/close-btn? close-btn?
              :modal/close-backdrop? (if (boolean? close-backdrop?) close-backdrop? true))))
   nil))

(defn close-modal!
  []
  (when-not (editing?)
    (if (seq (get-sub-modals))
      (close-sub-modal!)
      (swap! state assoc
             :modal/id nil
             :modal/label ""
             :modal/show? false
             :modal/fullscreen? false
             :modal/panel-content nil
             :ui/open-select nil))))

(defn get-db-batch-txs-chan
  []
  (:db/batch-txs @state))

(defn get-file-write-chan
  []
  (:file/writes @state))

(defn get-reactive-custom-queries-chan
  []
  (:reactive/custom-queries @state))

(defn get-left-sidebar-open?
  []
  (get-in @state [:ui/left-sidebar-open?]))

(defn set-left-sidebar-open!
  [value]
  (storage/set "ls-left-sidebar-open?" (boolean value))
  (set-state! :ui/left-sidebar-open? value))

(defn toggle-left-sidebar!
  []
  (set-left-sidebar-open!
    (not (get-left-sidebar-open?))))

(defn set-developer-mode!
  [value]
  (set-state! :ui/developer-mode? value)
  (storage/set "developer-mode" (str value)))

(defn developer-mode?
  []
  (:ui/developer-mode? @state))

(defn get-notification-contents
  []
  (get @state :notification/contents))

(defn document-mode?
  []
  (get @state :document/mode?))

(defn toggle-document-mode!
  []
  (let [mode (document-mode?)]
    (set-state! :document/mode? (not mode))
    (storage/set :document/mode? (not mode))))

(defn shortcut-tooltip-enabled?
  []
  (get @state :ui/shortcut-tooltip?))

(defn toggle-shortcut-tooltip!
  []
  (let [mode (shortcut-tooltip-enabled?)]
    (set-state! :ui/shortcut-tooltip? (not mode))
    (storage/set :ui/shortcut-tooltip? (not mode))))

(defn set-config!
  [repo-url value]
  (when value (set-state! [:config repo-url] value)))

(defn set-global-config!
  [value]
  ;; Placed under :config so cursors can work seamlessly
  (when value (set-config! ::global-config value)))

(defn get-wide-mode?
  []
  (:ui/wide-mode? @state))

(defn toggle-wide-mode!
  []
  (update-state! :ui/wide-mode? not))

(defn set-online!
  [value]
  (set-state! :network/online? value))

(defn get-plugins-slash-commands
  []
  (mapcat seq (flatten (vals (:plugin/installed-slash-commands @state)))))

(defn get-plugins-commands-with-type
  [type]
  (filterv #(= (keyword (first %)) (keyword type))
           (apply concat (vals (:plugin/simple-commands @state)))))

(defn get-plugins-ui-items-with-type
  [type]
  (filterv #(= (keyword (first %)) (keyword type))
           (apply concat (vals (:plugin/installed-ui-items @state)))))

(defn get-plugin-resources-with-type
  [pid type]
  (when-let [pid (and type (keyword pid))]
    (get-in @state [:plugin/installed-resources pid (keyword type)])))

(defn get-plugin-resource
  [pid type key]
  (when-let [resources (get-plugin-resources-with-type pid type)]
    (get resources key)))

(defn upt-plugin-resource
  [pid type key attr val]
  (when-let [resource (get-plugin-resource pid type key)]
    (let [resource (assoc resource (keyword attr) val)]
      (set-state!
        [:plugin/installed-resources (keyword pid) (keyword type) key] resource)
      resource)))

(defn get-plugin-services
  [pid type]
  (when-let [installed (and pid (:plugin/installed-services @state))]
    (some->> (seq (get installed (keyword pid)))
             (filterv #(= type (:type %))))))

(defn install-plugin-service
  ([pid type name] (install-plugin-service pid type name nil))
  ([pid type name opts]
   (when-let [pid (and pid type name (keyword pid))]
     (let [exists (get-plugin-services pid type)]
       (when-let [service (and (or (not exists) (not (some #(= name (:name %)) exists)))
                               {:pid pid :type type :name name :opts opts})]
         (update-state! [:plugin/installed-services pid] #(conj (vec %) service))

         ;; search engines state for results
         (when (= type :search)
           (set-state! [:search/engines (str pid name)] service)))))))

(defn uninstall-plugin-service
  [pid type-or-all]
  (when-let [pid (keyword pid)]
    (when-let [installed (get (:plugin/installed-services @state) pid)]
      (let [remove-all? (or (true? type-or-all) (nil? type-or-all))
            remains     (if remove-all? nil (filterv #(not= type-or-all (:type %)) installed))
            removed     (if remove-all? installed (filterv #(= type-or-all (:type %)) installed))]
        (set-state! [:plugin/installed-services pid] remains)

        ;; search engines state for results
        (when-let [removed' (seq (filter #(= :search (:type %)) removed))]
          (update-state! :search/engines #(apply dissoc % (mapv (fn [{:keys [pid name]}] (str pid name)) removed'))))))))

(defn get-all-plugin-services-with-type
  [type]
  (when-let [installed (vals (:plugin/installed-services @state))]
    (mapcat (fn [s] (filter #(= (keyword type) (:type %)) s)) installed)))

(defn get-all-plugin-search-engines
  []
  (:search/engines @state))

(defn update-plugin-search-engine
  [pid name f]
  (when-let [pid (keyword pid)]
    (set-state! :search/engines
                (update-vals (get-all-plugin-search-engines)
                             #(if (and (= pid (:pid %)) (= name (:name %)))
                                (f %) %)))))

(defn reset-plugin-search-engines
  []
  (when-let [engines (get-all-plugin-search-engines)]
    (set-state! :search/engines
                (update-vals engines #(assoc % :result nil)))))

(defn install-plugin-hook
  ([pid hook] (install-plugin-hook pid hook true))
  ([pid hook opts]
   (when-let [pid (keyword pid)]
     (set-state!
      [:plugin/installed-hooks hook]
      (assoc
        ((fnil identity {}) (get-in @state [:plugin/installed-hooks hook]))
        pid opts)) true)))

(defn uninstall-plugin-hook
  [pid hook-or-all]
  (when-let [pid (keyword pid)]
    (if (nil? hook-or-all)
      (swap! state update :plugin/installed-hooks #(update-vals % (fn [ids] (dissoc ids pid))))
      (when-let [coll (get-in @state [:plugin/installed-hooks hook-or-all])]
        (set-state! [:plugin/installed-hooks hook-or-all] (dissoc coll pid))))
    true))

(defn slot-hook-exist?
  [uuid]
  (when-let [type (and uuid (string/replace (str uuid) "-" "_"))]
    (when-let [hooks (sub :plugin/installed-hooks)]
      (contains? hooks (str "hook:editor:slot_" type)))))

(defn active-tldraw-app
  []
  (when-let [tldraw-el (.querySelector js/document.body ".logseq-tldraw[data-tlapp]")]
    (gobj/get js/window.tlapps (.. tldraw-el -dataset -tlapp))))

(defn tldraw-editing-logseq-block?
  []
  (when-let [app (active-tldraw-app)]
    (and (= 1 (.. app -selectedShapesArray -length))
         (= (.. app -editingShape) (.. app -selectedShapesArray (at 0))))))

(defn set-graph-syncing?
  [value]
  (set-state! :graph/syncing? value))

(defn set-editor-in-composition!
  [value]
  (set-state! :editor/in-composition? value))

(defn editor-in-composition?
  []
  (:editor/in-composition? @state))

(defn set-loading-files!
  [repo value]
  (when repo
    (set-state! [:repo/loading-files? repo] value)))

(defn loading-files?
  [repo]
  (get-in @state [:repo/loading-files? repo]))

(defn set-editor-last-input-time!
  [repo time]
  (swap! state assoc-in [:editor/last-input-time repo] time))

(defn set-last-transact-time!
  [repo time]
  (swap! state assoc-in [:db/last-transact-time repo] time)

  ;; THINK: new block, indent/outdent, drag && drop, etc.
  (set-editor-last-input-time! repo time))

(defn set-db-persisted!
  [repo value]
  (swap! state assoc-in [:db/persisted? repo] value))

(defn db-idle?
  [repo]
  (when repo
    (when-let [last-time (get-in @state [:db/last-transact-time repo])]
      (let [now (util/time-ms)]
        (>= (- now last-time) 3000)))))

(defn input-idle?
  [repo & {:keys [diff]
           :or {diff 1000}}]
  (when repo
    (or
     (when-let [last-time (get-in @state [:editor/last-input-time repo])]
       (let [now (util/time-ms)]
         (>= (- now last-time) diff)))
     ;; not in editing mode
     ;; Is this a good idea to put whiteboard check here?
     (not (get-edit-input-id)))))

(defn whiteboard-idle?
  "Check if whiteboard is idle."
  [repo]
  (when repo
    (>= (- (util/time-ms) (or (get-in @state [:whiteboard/last-persisted-at repo])
                              (- (util/time-ms) 10000)))
        3000)))

(defn set-nfs-refreshing!
  [value]
  (set-state! :nfs/refreshing? value))

(defn nfs-refreshing?
  []
  (:nfs/refreshing? @state))

(defn set-search-result!
  [value]
  (set-state! :search/result value))

(defn clear-search-result!
  []
  (set-search-result! nil))

(defn add-graph-search-filter!
  [q]
  (when-not (string/blank? q)
    (update-state! :search/graph-filters
                   (fn [value]
                     (vec (distinct (conj value q)))))))

(defn remove-search-filter!
  [q]
  (when-not (string/blank? q)
    (update-state! :search/graph-filters
                   (fn [value]
                     (remove #{q} value)))))

(defn clear-search-filters!
  []
  (set-state! :search/graph-filters []))

(defn get-search-mode
  []
  (:search/mode @state))

(defn toggle!
  [path]
  (update-state! path not))

(defn toggle-settings!
  []
  (toggle! :ui/settings-open?))

(defn settings-open?
  []
  (:ui/settings-open? @state))

(defn close-settings!
  []
  (set-state! :ui/settings-open? false))

(defn open-settings!
  []
  (set-state! :ui/settings-open? true))

;; TODO: Move those to the uni `state`

(defn set-editor-op!
  [value]
  (set-state! :editor/op value)
  (when value (set-state! :editor/latest-op value)))

(defn get-editor-op
  []
  (:editor/op @state))

(defn get-editor-latest-op
  []
  (:editor/latest-op @state))

(defn get-events-chan
  []
  (:system/events @state))

(defn pub-event!
  {:malli/schema [:=> [:cat vector?] :any]}
  [payload]
  (let [chan (get-events-chan)]
    (async/put! chan payload)))

(defn get-export-block-text-indent-style []
  (:copy/export-block-text-indent-style @state))

(defn set-export-block-text-indent-style!
  [v]
  (set-state! :copy/export-block-text-indent-style v)
  (storage/set :copy/export-block-text-indent-style v))

(defn get-export-block-text-remove-options []
  (:copy/export-block-text-remove-options @state))

(defn update-export-block-text-remove-options!
  [e k]
  (let [f (if (util/echecked? e) conj disj)]
    (update-state! :copy/export-block-text-remove-options
                   #(f % k))
    (storage/set :copy/export-block-text-remove-options
                 (get-export-block-text-remove-options))))

(defn get-export-block-text-other-options []
  (:copy/export-block-text-other-options @state))

(defn update-export-block-text-other-options!
  [k v]
  (update-state! :copy/export-block-text-other-options #(assoc % k v)))

(defn set-editor-args!
  [args]
  (set-state! :editor/args args))

(defn editing-whiteboard-portal?
  []
  (and (active-tldraw-app) (tldraw-editing-logseq-block?)))

(defn block-component-editing?
  []
  (and (:block/component-editing-mode? @state)
       (not (editing-whiteboard-portal?))))

(defn set-block-component-editing-mode!
  [value]
  (set-state! :block/component-editing-mode? value))

(defn get-editor-args
  []
  (:editor/args @state))

(defn set-page-blocks-cp!
  [value]
  (set-state! [:view/components :page-blocks] value))

(defn get-page-blocks-cp
  []
  (get-in @state [:view/components :page-blocks]))

;; To avoid circular dependencies
(defn set-component!
  [k value]
  (set-state! [:view/components k] value))

(defn get-component
  [k]
  (get-in @state [:view/components k]))

(defn exit-editing-and-set-selected-blocks!
  ([blocks]
   (exit-editing-and-set-selected-blocks! blocks :down))
  ([blocks direction]
   (clear-edit!)
   (set-selection-blocks! blocks direction)))

(defn set-editing!
  ([edit-input-id content block cursor-range]
   (set-editing! edit-input-id content block cursor-range true))
  ([edit-input-id content block cursor-range move-cursor?]
   (if (> (count content)
          (block-content-max-length (get-current-repo)))
     (let [elements (array-seq (js/document.getElementsByClassName (:block/uuid block)))]
       (when (first elements)
         (util/scroll-to-element (gobj/get (first elements) "id")))
       (exit-editing-and-set-selected-blocks! elements))
     (when (and edit-input-id block
               (or
                (publishing-enable-editing?)
                (not @publishing?)))
      (let [block-element (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block"))
            container (util/get-block-container block-element)
            block (if container
                    (assoc block
                           :block.temp/container (gobj/get container "id"))
                    block)
            content (string/trim (or content ""))]
        (swap! state
               (fn [state]
                 (-> state
                     (assoc-in [:editor/content edit-input-id] content)
                     (assoc
                      :editor/block block
                      :editor/editing? {edit-input-id true}
                      :editor/last-key-code nil
                      :editor/set-timestamp-block nil
                      :cursor-range cursor-range))))
        (when-let [input (gdom/getElement edit-input-id)]
          (let [pos (count cursor-range)]
            (when content
              (util/set-change-value input content))

            (when move-cursor?
              (cursor/move-cursor-to input pos))

            (when (or (util/mobile?) (mobile-util/native-platform?))
              (set-state! :mobile/show-action-bar? false)))))))))

(defn remove-watch-state [key]
  (remove-watch state key))

(defn get-git-auto-commit-enabled?
  []
  (false? (sub [:electron/user-cfgs :git/disable-auto-commit?])))

(defn set-last-key-code!
  [key-code]
  (set-state! :editor/last-key-code key-code))

(defn get-last-key-code
  []
  (:editor/last-key-code @state))

(defn feature-http-server-enabled?
  []
  (boolean (storage/get ::storage-spec/http-server-enabled)))

(defn get-plugin-by-id
  [id]
  (when-let [id (and id (keyword id))]
    (get-in @state [:plugin/installed-plugins id])))

(defn get-enabled?-installed-plugins
  ([theme?] (get-enabled?-installed-plugins theme? true false false))
  ([theme? enabled? include-unpacked? include-all?]
   (filterv
     #(and (if include-unpacked? true (:iir %))
           (if-not (boolean? enabled?) true (= (not enabled?) (boolean (get-in % [:settings :disabled]))))
           (or include-all? (if (boolean? theme?) (= (boolean theme?) (:theme %)) true)))
     (vals (:plugin/installed-plugins @state)))))

(defn lsp-enabled?-or-theme
  []
  (:plugin/enabled @state))

(def lsp-enabled?
  (lsp-enabled?-or-theme))

(defn consume-updates-from-coming-plugin!
  [payload updated?]
  (when-let [id (keyword (:id payload))]
    (let [prev-pending? (boolean (seq (:plugin/updates-pending @state)))]
      (println "Updates: consumed pending - " id)
      (swap! state update :plugin/updates-pending dissoc id)
      (if updated?
        (if-let [error (:error-code payload)]
          (swap! state update-in [:plugin/updates-coming id] assoc :error-code error)
          (swap! state update :plugin/updates-coming dissoc id))
        (swap! state update :plugin/updates-coming assoc id payload))
      (pub-event! [:plugin/consume-updates id prev-pending? updated?]))))

(defn coming-update-new-version?
  [pkg]
  (and pkg (:latest-version pkg)))

(defn plugin-update-available?
  [id]
  (when-let [pkg (and id (get (:plugin/updates-coming @state) (keyword id)))]
    (coming-update-new-version? pkg)))

(defn all-available-coming-updates
  ([] (all-available-coming-updates (:plugin/updates-coming @state)))
  ([updates] (when-let [updates (vals updates)]
               (filterv #(coming-update-new-version? %) updates))))

(defn get-next-selected-coming-update
  []
  (when-let [updates (all-available-coming-updates)]
    (let [unchecked (:plugin/updates-unchecked @state)]
      (first (filter #(and (not (and (seq unchecked) (contains? unchecked (:id %))))
                           (not (:error-code %))) updates)))))

(defn set-unchecked-update
  [id unchecked?]
  (swap! state update :plugin/updates-unchecked (if unchecked? conj disj) id))

(defn reset-unchecked-update
  []
  (swap! state assoc :plugin/updates-unchecked #{}))

(defn reset-all-updates-state
  []
  (swap! state assoc
         :plugin/updates-auto-checking?         false
         :plugin/updates-pending                {}
         :plugin/updates-coming                 {}
         :plugin/updates-downloading?           false))

(defn sub-right-sidebar-blocks
  []
  (when-let [current-repo (get-current-repo)]
    (->> (sub :sidebar/blocks)
         (filter #(= (first %) current-repo)))))


(defn toggle-collapsed-block!
  [block-id]
  (let [current-repo (get-current-repo)]
    (update-state! [:ui/collapsed-blocks current-repo block-id] not)))

(defn set-collapsed-block!
  [block-id value]
  (let [current-repo (get-current-repo)]
    (set-state! [:ui/collapsed-blocks current-repo block-id] value)))

(defn sub-collapsed
  [block-id]
  (sub [:ui/collapsed-blocks (get-current-repo) block-id]))

(defn get-modal-id
  []
  (:modal/id @state))

(defn edit-in-query-or-refs-component
  []
  (let [config (last (get-editor-args))]
    {:custom-query? (:custom-query? config)
     :ref? (:ref? config)}))

(defn set-auth-id-token
  [id-token]
  (set-state! :auth/id-token id-token))

(defn set-auth-refresh-token
  [refresh-token]
  (set-state! :auth/refresh-token refresh-token))

(defn set-auth-access-token
  [access-token]
  (set-state! :auth/access-token access-token))

(defn get-auth-id-token []
  (sub :auth/id-token))

(defn get-auth-refresh-token []
  (:auth/refresh-token @state))

(defn set-file-sync-manager [graph-uuid v]
  (when (and graph-uuid v)
    (set-state! [:file-sync/graph-state graph-uuid :file-sync/sync-manager] v)))

(defn get-file-sync-manager [graph-uuid]
  (get-in @state [:file-sync/graph-state graph-uuid :file-sync/sync-manager]))

(defn clear-file-sync-state! [graph-uuid]
  (set-state! [:file-sync/graph-state graph-uuid] nil))

(defn clear-file-sync-progress! [graph-uuid]
  (set-state! [:file-sync/graph-state
               graph-uuid
               :file-sync/progress]
              nil))

(defn set-file-sync-state [graph-uuid v]
  (when v (s/assert :frontend.fs.sync/sync-state v))
  (set-state! [:file-sync/graph-state graph-uuid :file-sync/sync-state] v))

(defn get-current-file-sync-graph-uuid
  []
  (get-in @state [:file-sync/graph-state :current-graph-uuid]))

(defn sub-current-file-sync-graph-uuid
  []
  (sub [:file-sync/graph-state :current-graph-uuid]))

(defn get-file-sync-state
  ([]
   (get-file-sync-state (get-current-file-sync-graph-uuid)))
  ([graph-uuid]
   (get-in @state [:file-sync/graph-state graph-uuid :file-sync/sync-state])))

(defn sub-file-sync-state
  [graph-uuid]
  (sub [:file-sync/graph-state graph-uuid :file-sync/sync-state]))

(defn reset-parsing-state!
  []
  (set-state! [:graph/parsing-state (get-current-repo)] {}))

(defn set-parsing-state!
  [m]
  (update-state! [:graph/parsing-state (get-current-repo)]
                 (if (fn? m) m
                   (fn [old-value] (merge old-value m)))))

(defn http-proxy-enabled-or-val? []
  (when-let [{:keys [type protocol host port] :as agent-opts} (sub [:electron/user-cfgs :settings/agent])]
    (when (and  (not (contains? #{"system"} type))
                (every? not-empty (vals agent-opts)))
      (str protocol "://" host ":" port))))

(defn set-mobile-app-state-change
  [is-active?]
  (set-state! :mobile/app-state-change
              {:is-active? is-active?
               :timestamp (inst-ms (js/Date.))}))

(defn get-sync-graph-by-id
  [graph-uuid]
  (when graph-uuid
    (let [graph (first (filter #(= graph-uuid (:GraphUUID %))
                               (get-repos)))]
      (when (:url graph)
        graph))))

(defn unlinked-dir?
  [dir]
  (contains? (:file/unlinked-dirs @state) dir))

(defn get-file-rename-event-chan
  []
  (:file/rename-event-chan @state))

(defn offer-file-rename-event-chan!
  [v]
  {:pre [(map? v)
         (= #{:repo :old-path :new-path} (set (keys v)))]}
  (async/offer! (get-file-rename-event-chan) v))

(defn set-onboarding-whiteboard!
  [v]
  (set-state! :whiteboard/onboarding-whiteboard? v)
  (storage/set :ls-onboarding-whiteboard? v))

(defn get-onboarding-whiteboard?
  []
  (get-in @state [:whiteboard/onboarding-whiteboard?]))

(defn get-local-container-root-url
  []
  (when (mobile-util/native-ios?)
    (get-in @state [:mobile/container-urls :localContainerUrl])))

(defn get-icloud-container-root-url
  []
  (when (mobile-util/native-ios?)
    (get-in @state [:mobile/container-urls :iCloudContainerUrl])))

(defn get-current-pdf
  []
  (:pdf/current @state))

(defn nfs-user-granted?
  [repo]
  (get-in @state [:nfs/user-granted? repo]))

(defn set-current-pdf!
  [inflated-file]
  (let [settle-file! #(set-state! :pdf/current inflated-file)]
    (if-not (get-current-pdf)
      (settle-file!)
      (when (apply not= (map :identity [inflated-file (get-current-pdf)]))
        (set-state! :pdf/current nil)
        (js/setTimeout #(settle-file!) 16)))))

(defn focus-whiteboard-shape
  ([shape-id]
   (focus-whiteboard-shape (active-tldraw-app) shape-id))
  ([tln shape-id]
   (when-let [^js api (gobj/get tln "api")]
     (when (and shape-id (parse-uuid shape-id))
       (. api selectShapes shape-id)
       (. api zoomToSelection)))))

(defn set-user-info!
  [info]
  (when info
    (set-state! :user/info info)
    (let [groups (:UserGroups info)]
      (when (seq groups)
        (storage/set :user-groups groups)))))

(defn get-user-info []
  (sub :user/info))

(defn clear-user-info!
  []
  (storage/remove :user-groups))
