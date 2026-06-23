(ns frontend.state
  "Provides main application state and subscriptions."
  (:require [cljs-bean.core :as bean]
            [cljs.core.async :as async :refer [>!]]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [electron.locale :as electron-locale]
            [frontend.db.conn-state :as db-conn-state]
            [frontend.dicts :as dicts]
            [frontend.graph-tab :as graph-tab]
            [frontend.mobile.util :as mobile-util]
            [frontend.rfx :as rfx]
            [frontend.spec.storage :as storage-spec]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defonce *profile-state (volatile! {}))

(defonce *db-worker (atom nil))
(defonce *db-worker-thread (atom nil))
(defonce *db-worker-client-id (atom (storage/get :db-worker-client-id)))
(defonce *editor-info (atom nil))
(defonce app-ready-promise (p/deferred))

(def ^:private supported-locale-tags
  (into {}
        (map (fn [locale]
               [(string/lower-case (name locale)) locale])
             (keys dicts/dicts))))

(defn- canonical-preferred-language
  "Convert browser/storage locale tags into one supported locale string."
  [language]
  (let [tag (cond
              (keyword? language) (name language)
              (string? language) language
              :else nil)]
    (when-not (string/blank? tag)
      (let [normalized-tag (some-> tag string/trim string/lower-case)
            base-tag (some-> normalized-tag (string/split #"-") first)]
        (some-> (or (get supported-locale-tags normalized-tag)
                    (get supported-locale-tags base-tag)
                    :en)
                name)))))

(def db-worker-ready?
  "`<invoke-db-worker` throws err if `*db-worker` not ready yet.
  Use this atom to wait till db-worker ready."
  (let [ready? (atom (fn? @*db-worker))]
    (add-watch *db-worker ::db-worker-ready?
               (fn [_ _ _ worker]
                 (reset! ready? (fn? worker))))
    ready?))

(defn <invoke-db-worker
  "invoke db-worker thread api"
  [qkw & args]
  (let [worker @*db-worker]
    (when (nil? worker)
      (prn :<invoke-db-worker-error qkw)
      (throw (ex-info "db-worker has not been initialized" {})))
    (apply worker qkw args)))

(def ^:private export-block-text-indent-styles #{"dashes" "spaces" "no-indent"})

(def ^:private legacy-export-block-text-indent-styles
  {"indent-style-dashes" "dashes"
   "indent-style-spaces" "spaces"
   "indent-style-none" "no-indent"})

(defn- normalize-export-block-text-indent-style
  [v]
  (cond
    (nil? v) nil
    (contains? export-block-text-indent-styles v) v
    (contains? legacy-export-block-text-indent-styles v) (get legacy-export-block-text-indent-styles v)
    :else (throw (ex-info "Invalid export block text indent style" {:value v}))))

;; Stores main application state
(defonce ^:large-vars/data-var state
  (let [document-mode? (or (storage/get :document/mode?) false)
        current-graph  (let [url-graph (:graph (util/parse-params))
                             graph (or url-graph
                                       (graph-tab/get-tab-repo)
                                       (storage/get :git/current-repo))]
                         (when graph (ipc/ipc "setCurrentGraph" graph))
                         graph)]
    (atom
     {:client-id                             (str (random-uuid))
      :route-match                           nil
      :today                                 nil
      :reactive/custom-queries               (async/chan 1000)
      :instrument/disabled?                  (storage/get "instrument-disabled")
      ;; TODO: how to detect the network reliably?
      ;; NOTE: prefer to use flows/network-online?
      :network/online?         true
      :me                      nil
      :git/current-repo        current-graph
      :db/restoring?           nil
      :db/query-results                      {}
      :search/q                              ""
      :search/mode                           nil
      :search/args                           nil
      :search/result                         nil
      :search/engines                        {}
      :search/index-build                    {:running? false
                                              :repo nil
                                              :progress 0
                                              :processed 0
                                              :total 0}

      ;; modals
      :modal/dropdowns                       {}
      :modal/id                              nil
      :notification/contents                 {}

      ;; ui
      :ui/viewport                           {}
      :ui/show-property-dialog?              false

      ;; left sidebar
      :ui/navigation-item-collapsed?         {}
      :ui/recent-pages                       (or (storage/get :ui/recent-pages) {})

      ;; right sidebar
      :ui/handbooks-open?                    false
      :ui/help-open?                         false
      :ui/fullscreen?                        false
      :ui/settings-open?                     false
      :ui/sidebar-open?                      false
      :ui/sidebar-width                      "40%"
      :ui/left-sidebar-open?                 (boolean (storage/get :ls-left-sidebar-open?))
      :ui/theme                              (or (storage/get :ui/theme) "light")
      :ui/system-theme?                      ((fnil identity (or util/mac? util/win32? false)) (storage/get :ui/system-theme?))
      :ui/custom-theme                       (or (storage/get :ui/custom-theme) {:light {:mode "light"} :dark {:mode "dark"}})
      :ui/wide-mode?                         (storage/get :ui/wide-mode)
      :ui/radix-color                        (storage/get :ui/radix-color)
      :ui/editor-font                        (storage/get :ui/editor-font)

      ;; ui/collapsed-blocks is to separate the collapse/expand state from db for:
      ;; 1. right sidebar
      ;; 2. zoom-in view
      ;; 3. queries
      ;; 4. references
      ;; graph => {container-id {:block-id bool}}
      :ui/collapsed-blocks                   {}
      :ui/sidebar-collapsed-blocks           {}
      :ui/file-component                     nil
      :ui/developer-mode?                    (or (= (storage/get "developer-mode") "true")
                                                 false)
      ;; remember scroll positions of visited paths
      :ui/paths-scroll-positions             {}
      :ui/main-container-scroll-top          nil
      :ui/shortcut-tooltip?                  (if (false? (storage/get :ui/shortcut-tooltip?))
                                               false
                                               true)
      :ui/shortcut-handler-refreshing?       false
      :ui/scrolling?                         false
      :ui/show-empty-and-hidden-properties?  {:mode :global
                                              :show? false}
      :document/mode?                        document-mode?

      :config                                {}
      :block/component-editing-mode?         false
      :editor/op                             nil
      :editor/start-pos                      nil
      :editor/pending-new-block              nil
      :editor/hidden-editors                 #{} ;; page names

      :editor/action                         nil
      :editor/action-data                    nil
      ;; With label or other data
      :editor/last-saved-cursor              {}
      :editor/editing?                       nil
      :editor/in-composition?                false
      :editor/code-mode?                     false
      :editor/content                        {}
      :editor/block                          nil
      :editor/set-timestamp-block            nil ;; click rendered block timestamp-cp to set timestamp
      :editor/last-input-time                {}
      :editor/document-mode?                 document-mode?
      :editor/args                           nil
      :editor/on-paste?                      false
      :editor/last-key-code                  nil
      :ui/global-last-key-code               nil
      :editor/block-op-type                  nil ;; :cut, :copy
      :editor/block-refs                     #{}

      ;; Stores deleted refed blocks, indexed by repo
      :editor/last-replace-ref-content-tx    nil

      :editor/code-block-context             nil
      :editor/latest-shortcut                nil

      :history/paused?                       false
      :editor/cursor-range                   nil
      :editor/container-id                   nil
      :editor/next-edit-block                nil
      :editor/raw-mode-block                 nil
      :editor/virtualized-scroll-fn          nil
      :editor/edit-block-fn                  nil

      ;; Warning: blocks order is determined when setting this attribute
      :selection/blocks                      []
      :selection/start-block                 nil
      ;; nil, :up or :down
      ;; used to determine selection direction when two or more blocks are selected
      :selection/direction                   nil
      :selection/selected-all?               false
      :custom-context-menu/show?             false
      :custom-context-menu/links             nil
      :custom-context-menu/position          nil

      ;; pages or blocks in the right sidebar
      ;; It is a list of `[repo db-id block-type block-data]` 4-tuple
      :sidebar/blocks                        '()

      :preferred-language                    (canonical-preferred-language (storage/get :preferred-language))

      ;; electron
      :electron/auto-updater-downloaded      false
      :electron/updater-pending?             false
      :electron/updater                      {}
      :electron/app-base-info                nil
      :electron/user-cfgs                    nil
      :electron/server                       nil
      :electron/window-maximized?            false
      :electron/window-fullscreen?           false

      ;; assets
      :assets/alias-enabled?                 (or (storage/get :assets/alias-enabled?) false)
      :assets/alias-dirs                     (or (storage/get :assets/alias-dirs) [])
      :assets/asset-file-write-finish        {}

      ;; mobile
      :mobile/container-urls                 nil
      :mobile/show-action-bar?               false
      :mobile/show-tabbar?                   false

      ;; plugin
      :plugin/enabled                        (and util/plugin-platform?
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
      :pdf/auto-open-ctx-menu?               (not= false (storage/get "ls-pdf-auto-open-ctx-menu"))

      :copy/export-block-text-indent-style   (or (normalize-export-block-text-indent-style
                                                  (storage/get :copy/export-block-text-indent-style))
                                                 "dashes")
      :copy/export-block-text-remove-options (or (storage/get :copy/export-block-text-remove-options)
                                                 #{})
      :copy/export-block-text-other-options  (or (storage/get :copy/export-block-text-other-options)
                                                 {})
      :date-picker/date                      nil
      :page-title/context                    nil
      :block-ref/context                     nil

      :youtube/players                       {}

      ;; command palette
      :command-palette/commands              []

      :view/components                       {}
      :view/selected-blocks                  nil

      :srs/mode?                             false

      :srs/cards-due-count                   nil

      :reactive/query-dbs                    {}

      ;; login, userinfo, token, ...
      :auth/refresh-token                    (some-> (storage/get "refresh-token") str)
      :auth/access-token                     nil
      :auth/id-token                         nil
      :auth/oauth-token-url                  nil
      :auth/oauth-domain                     nil
      :auth/oauth-client-id                  nil
      :auth/current-login-user               nil

      ;; graph-uuid -> ...
      :rtc/state                             {}
      :rtc/editing-users-by-block            {}
      :rtc/loading-graphs?                   nil
      ;; only latest rtc-log stored here, derive a log stream from state when needed.
      :rtc/log                               nil
      :rtc/uploading?                        false
      :rtc/downloading-graph-uuid            nil
      :rtc/graphs                            []
      :rtc/online-info                       {}
      :rtc/asset-upload-download-progress    {}
      :rtc/users-info                        {}
      :sync/block-conflicts                  {}

      :user/info                             {:UserGroups (storage/get :user-groups)}
      :encryption/graph-parsing?             false

      :ui/loading?                           {}
      :ui/container-id                       0
      :ui/cached-key->container-id           {}
      :feature/enable-sync?                  (storage/get :logseq-sync-enabled)

      :ui/find-in-page                       nil
      :comments/inline-thread                nil
      :graph/exporting                       nil
      :graph/exporting-state                 nil
      :graph/importing                       nil
      :graph/importing-state                 {}
      :graph/loading?                        nil
      :handbook/route-chan                   (async/chan (async/sliding-buffer 1))

      :system/info                           {}
      ;; Whether block is selected
      :ui/select-query-cache                 {}
      :view/table-selection                  {}
      :ui/toggle-highlight-recent-blocks?    false
      :ui/highlight-recent-days              (or (storage/get :ui/highlight-recent-days)
                                                 3)
      :favorites/updated?                    0
      :db/async-queries                      {}
      :sync-graph/init?                      nil
      :db/latest-transacted-entity-uuids     {}})))

(rfx/init! {:initial-value @state
            :registry (atom {})})

(defn register-rfx-state-subs!
  []
  (rfx/reg-sub! ::state-key
    (fn [db [_ k]]
      (get db k)))
  (doseq [k (keys (rfx/snapshot))]
    (rfx/register-state-sub-id! k)
    (rfx/reg-sub! k
      [[::state-key k]]
      (fn [value [_ & path]]
        (if (seq path)
          (get-in value path)
          value))))
  (rfx/register-state-sub-id! :view/table-selection)
  (rfx/reg-sub! :selection/block-selected?
    [[:selection/blocks]]
    (fn [selection-blocks [_ block-id]]
      (boolean
       (some #(= block-id (some-> % (dom/attr "blockid") uuid))
             selection-blocks))))
  true)

(register-rfx-state-subs!)

(declare get-state update-state! set-state!)
(defn async-query-requested?
  [query-key]
  (get (get-state :db/async-queries) query-key))

(defn mark-async-query-requested!
  [query-key]
  (update-state! :db/async-queries assoc query-key true))

(defn clear-async-queries!
  []
  (set-state! :db/async-queries {}))

(defn set-sync-block-conflicts!
  [repo block-id conflicts]
  (set-state! :sync/block-conflicts
              (or conflicts [])
              :nested-path [repo (str block-id)]))

;; User configuration getters under :config (and sometimes :me)
;; ========================================
;; TODO: Refactor default config values to be data driven. Currently they are all
;;  buried in getters
;; TODO: Refactor our access to be more data driven. Currently each getter
;;  (re-)fetches get-current-repo needlessly
;; TODO: Add consistent validation. Only a few config options validate at get time

(def common-default-config
  "Common default config for a user's repo config"
  {:feature/enable-search-remove-accents? true
   :ui/auto-expand-block-refs? true})

(def db-default-config
  "Default repo config for DB graphs"
  (merge common-default-config
         ;; The "DOING" query returns tasks with "Doing" status for recent past days
         ;; The "TODO" query returns tasks with "Todo" status for upcoming future days
         {:default-queries
          {:journals
           [{:title-key :journal.default-query/doing
             :title-icon "InProgress50"
             :query '[:find (pull ?b [*])
                      :in $ ?start ?today
                      :where
                      (task ?b #{"Doing"})
                      [?b :block/page ?p]
                      [?p :block/journal-day ?d]
                      [(>= ?d ?start)]
                      [(<= ?d ?today)]]
             :inputs [:14d :today]
             :collapsed? true}
            {:title-key :journal.default-query/todo
             :title-icon "Todo"
             :query '[:find (pull ?b [*])
                      :in $ ?start ?next
                      :where
                      (task ?b #{"Todo"})
                      [?b :block/page ?p]
                      [?p :block/journal-day ?d]
                      [(> ?d ?start)]
                      [(< ?d ?next)]]
             :inputs [:today :7d-after]
             :group-by-page? false
             :collapsed? true}]}
          :ui/hide-empty-properties? false}))

;; State that most user config is dependent on
(declare get-current-repo)

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

(defn get-global-config
  []
  (get-in @state [:config ::global-config]))

(defn get-global-config-str-content
  []
  (get-in @state [:config ::global-config-str-content]))

(defn get-graph-config
  ([] (get-graph-config (get-current-repo)))
  ([repo-url] (get-in @state [:config repo-url])))

(defn get-config
  "User config for the given repo or current repo if none given. All config fetching
should be done through this fn in order to get global config and config defaults"
  ([]
   (get-config (get-current-repo)))
  ([repo-url]
   (merge-configs
    db-default-config
    (get-global-config)
    (get-graph-config repo-url))))

(defn publishing-enable-editing?
  []
  (and common-config/PUBLISHING (:publishing/enable-editing? (get-config))))

(defn enable-editing?
  []
  (or (not common-config/PUBLISHING) (:publishing/enable-editing? (get-config))))

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

;; TODO: Move or remove as this is no longer stateful
(defn get-preferred-format
  [& _args]
  :markdown)

(defn markdown?
  []
  (= (keyword (get-preferred-format))
     :markdown))

(defn get-date-formatter
  []
  (or
   (when-let [repo (get-current-repo)]
     (when-let [conn (db-conn-state/get-conn repo)]
       (get (entity-plus/entity-memoized @conn :logseq.class/Journal)
            :logseq.property.journal/title-format)))
   "MMM do, yyyy"))

(defn custom-shortcuts []
  (merge (try (storage/get :ls-shortcuts)
              (catch :default e
                (prn :shortcut/storage-read-error e)
                nil))
         (:shortcuts (get-config))))

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
  (if-let [value (:ref/default-open-blocks-level (get-config))]
    (if (and (int? value) (>= value 0))
      (min value 9)
      2)
    2))

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

(defn enable-semantic-search?
  []
  (true? (get-in @state [:electron/user-cfgs :feature/enable-semantic-search?])))

;; State subscription helpers
;; ==========================

(declare document-mode?)

(defn- read-state-value
  [db ks nested-path]
  (let [ks-coll?               (coll? ks)
        get-fn                 (if ks-coll? get-in get)
        s                      (get-fn db ks)
        nested-path-coll? (coll? nested-path)]
    (cond
      (and nested-path nested-path-coll?)
      (get-in s nested-path)

      nested-path
      (get s nested-path)

      :else s)))

(defn get-state
  "Returns a plain state value.

  Use this outside component rendering or when the caller does not need reactive
  rendering. Components that render from state should use `frontend.rfx/use-sub`."
  [ks & {:keys [nested-path]}]
  (read-state-value (rfx/snapshot) ks nested-path))

(defn set-editing-block-id!
  [container-block]
  (set-state! :editor/editing? {container-block true}))

(defn config-for-repo
  [config repo]
  (merge-configs db-default-config
                 (get config ::global-config)
                 (get config repo)))

(defn enable-grammarly?
  []
  (true? (:feature/enable-grammarly? (get-config))))

(defn scheduled-deadlines-disabled?
  []
  (true? (:feature/disable-scheduled-and-deadline-query? (get-config))))

(defn enable-fold-button-right?
  []
  (and (util/mobile?)
       (util/sm-breakpoint?)))

(defn use-enable-fold-button-right?
  []
  (let [_ (rfx/use-sub [:ui/viewport])]
    (enable-fold-button-right?)))

(defn enable-flashcards?
  ([]
   (enable-flashcards? (get-current-repo)))
  ([repo]
   (not (false? (:feature/enable-flashcards? (get-config repo))))))

;; Enable by default
(defn show-brackets?
  []
  (not (false? (:ui/show-brackets? (get-config)))))

(defn- get-selected-block-ids
  [blocks]
  (->> blocks
       (remove nil?)
       (keep #(when-let [id (dom/attr % "blockid")]
                (uuid id)))
       (distinct)))

(defn block-content-max-length
  [repo]
  (or (:block/title-max-length (get-config repo))
      ;; backward compatible
      (:block/content-max-length (get-config repo))
      10000))

(defn mobile?
  []
  (or (util/mobile?) (mobile-util/native-platform?)))

(defn enable-tooltip?
  []
  (if (mobile?)
    false
    (get (get-config) :ui/enable-tooltip? true)))

(defn show-command-doc?
  []
  (get (get-config) :ui/show-command-doc? true))

(defn logical-outdenting?
  []
  (:editor/logical-outdenting? (get-config)))

(defn show-full-blocks?
  []
  (:ui/show-full-blocks? (get-config)))

(defn preferred-pasting-file?
  []
  (:editor/preferred-pasting-file? (get-config)))

(defn auto-expand-block-refs?
  []
  (:ui/auto-expand-block-refs? (get-config)))

(defn doc-mode-enter-for-new-line?
  []
  (and (document-mode?)
       (not (:shortcut/doc-mode-enter-for-new-block? (get-config)))))

(defn user-groups
  []
  (set (get-state [:user/info :UserGroups])))

;; State mutation helpers
;; ======================

(defn- assoc-state-db
  [db path value nested-path]
  (let [path-coll?             (coll? path)
        nested-path-coll? (coll? nested-path)]
    (cond
      (and nested-path nested-path-coll?)
      (if path-coll?
        (assoc-in db (into (vec path) nested-path) value)
        (assoc-in db (into [path] nested-path) value))

      nested-path
      (if path-coll?
        (assoc-in db (conj (vec path) nested-path) value)
        (assoc-in db [path nested-path] value))

      path-coll?
      (assoc-in db path value)

      :else
      (assoc db path value))))

(defn- full-state-path
  [path nested-path]
  (let [base-path (if (coll? path) (vec path) [path])]
    (cond
      (and nested-path (coll? nested-path))
      (into base-path nested-path)

      nested-path
      (conj base-path nested-path)

      :else
      base-path)))

(defn- update-state-db
  [db path f nested-path]
  (let [path-coll?             (coll? path)
        nested-path-coll? (coll? nested-path)]
    (cond
      (and nested-path nested-path-coll?)
      (if path-coll?
        (update-in db (into (vec path) nested-path) f)
        (update-in db (into [path] nested-path) f))

      nested-path
      (if path-coll?
        (update-in db (conj (vec path) nested-path) f)
        (update-in db [path nested-path] f))

      path-coll?
      (update-in db path f)

      :else
      (update db path f))))

(defn set-state!
  [path value & {:keys [nested-path]}]
  (vswap! *profile-state update path inc)
  (let [old-v (read-state-value (rfx/snapshot) path nested-path)]
    (when (not= old-v value)
      (let [db' (assoc-state-db (rfx/snapshot) path value nested-path)]
        (rfx/replace-state! db' (full-state-path path nested-path))
        (reset! state db'))))
  nil)

(defn update-state!
  [path f & {:keys [nested-path]}]
  (vswap! *profile-state update path inc)
  (let [db' (update-state-db (rfx/snapshot) path f nested-path)]
    (rfx/replace-state! db' (full-state-path path nested-path))
    (reset! state db'))
  nil)

(defn replace-state!
  [db]
  (rfx/replace-state! db)
  (reset! state db)
  nil)

(defn swap-state!
  [f & args]
  (replace-state! (apply f (rfx/snapshot) args)))

(defn- edit-block-fn-queue
  [value]
  (cond
    (vector? value) value
    (fn? value) [value]
    :else []))

(defn queue-edit-block-fn!
  [f]
  (when (fn? f)
    (update-state! :editor/edit-block-fn #(conj (edit-block-fn-queue %) f))))

(defn take-edit-block-fn!
  []
  (when-let [[f & more] (seq (edit-block-fn-queue @(:editor/edit-block-fn @state)))]
    (set-state! :editor/edit-block-fn (vec more))
    f))

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

(defn get-current-page
  []
  (when (= :page (get-current-route))
    (get-in (get-route-match)
            [:path-params :name])))

(defn route-has-p?
  []
  (get-in (get-route-match) [:query-params :p]))

(defn get-current-repo
  "Returns the current repo URL, or else open demo graph"
  []
  (:git/current-repo @state))

(defn get-rtc-graphs
  []
  (:rtc/graphs @state))

;; TODO: rtc version
(comment
  (defn get-remote-graph-usage
    [graphs]
    (->> graphs
         (map #(hash-map :uuid (:GraphUUID %)
                         :name (:GraphName %)
                         :used-gbs (/ (:GraphStorageUsage %) 1024 1024 1024)
                         :limit-gbs (/ (:GraphStorageLimit %) 1024 1024 1024)
                         :used-percent (/ (:GraphStorageUsage %) (:GraphStorageLimit %) 0.01)))
         (map #(assoc % :free-gbs (- (:limit-gbs %) (:used-gbs %))))
         (vec))))

(defn get-repos
  []
  (get-in @state [:me :repos]))

(defn set-repos!
  [repos]
  (set-state! [:me :repos] (distinct repos)))

(defn add-repo!
  [repo]
  (when (not (string/blank? repo))
    (update-state! [:me :repos]
                   (fn [repos]
                     (->> (conj repos repo)
                          (distinct))))))

(defn set-current-repo!
  [repo]
  (set-state! :git/current-repo repo)
  (if repo
    (storage/set :git/current-repo repo)
    (storage/remove :git/current-repo))
  (ipc/ipc "setCurrentGraph" repo))

(defn set-preferred-language!
  [language]
  (let [old-language (:preferred-language @state)
        new-language (canonical-preferred-language language)]
    (when (not= new-language old-language)
      (set-state! :preferred-language new-language)
      (storage/set :preferred-language new-language)
      (electron-locale/push-locale! new-language))))

(defn delete-repo!
  [repo]
  (swap-state! update-in [:me :repos]
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
  (get-state :editor/set-timestamp-block))

(defn get-edit-block
  []
  (get-state :editor/block))

(defn editing?
  []
  (seq (get-state :editor/editing?)))

(defn get-edit-input-id
  []
  (when-not (exists? js/process)
    (when (editing?)
      (try
        (when-let [elem (or (when-let [id (:block/uuid (get-edit-block))]
                              (gdom/getElement (str "edit-block-" id)))
                            js/document.activeElement)]
          (when (util/input? elem)
            (let [id (gobj/get elem "id")]
              (when (string/starts-with? id "edit-block-")
                id))))
        (catch :default _e)))))

(defn set-edit-content!
  ([value] (set-edit-content! (get-edit-input-id) value))
  ([input-id value] (set-edit-content! input-id value true))
  ([input-id value set-input-value?]
   (when input-id
     (when set-input-value?
       (when-let [input (gdom/getElement input-id)]
         (util/set-change-value input value)))
     (set-state! :editor/content value :nested-path
                 (or (:block/uuid (get-edit-block)) input-id)))))

(defn get-input
  []
  (when-let [id (get-edit-input-id)]
    (gdom/getElement id)))

(defn get-edit-content
  []
  (when-let [id (:block/uuid (get-edit-block))]
    (get (get-state :editor/content) id)))

(defn set-selection-start-block!
  [start-block]
  (set-state! :selection/start-block start-block))

(defn get-selection-start-block
  []
  (or (get-state :selection/start-block)
      (when-let [edit-block (get-edit-block)]
        (let [node (util/rec-get-node edit-block "ls-block")]
          (set-selection-start-block! node)
          node))))

(defn get-cursor-range
  []
  (get-state :editor/cursor-range))

(defn set-cursor-range!
  [range]
  (set-state! :editor/cursor-range range))

(defn set-search-mode!
  ([value] (set-search-mode! value nil))
  ([value args]
   (set-state! :search/mode value)
   (set-state! :search/args args)))

(defn set-editor-action!
  [value]
  (set-state! :editor/action value))

(defn set-editor-action-data!
  [value]
  (set-state! :editor/action-data value))

(defn get-editor-action
  []
  (get-state :editor/action))

(defn get-editor-action-data
  []
  (get-state :editor/action-data))

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
    (get-state :editor/action-data)))

(defn set-editor-show-commands!
  []
  (when-not (get-editor-action) (set-editor-action! :commands)))

(defn clear-editor-action!
  []
  (set-state! :editor/action nil))

(defn get-edit-pos
  []
  (when-let [input (get-input)]
    (util/get-selection-start input)))

(defn get-selection-direction
  []
  (get-state :selection/direction))

(defn get-unsorted-selection-blocks
  []
  (get-state :selection/blocks))

(defn get-selection-blocks
  []
  (let [result (get-unsorted-selection-blocks)
        direction (get-selection-direction)]
    (if (= direction :up)
      (vec (reverse result))
      result)))

(defn get-selection-block-ids
  []
  (get-selected-block-ids (get-selection-blocks)))

(defn dom-clear-selection!
  []
  (doseq [node (dom/by-class "selected")]
    (dom/remove-class! node "selected")))

(defn mark-dom-blocks-as-selected
  [nodes]
  (doseq [node nodes]
    (dom/add-class! node "selected")
    (when (dom/has-class? node "ls-table-row")
      (.focus node))))

(defn pub-event!
  {:malli/schema [:=> [:cat vector?] :any]}
  [payload]
  (rfx/pub-event! payload))

(defn- unselect-node
  [node]
  (dom/remove-class! node "selected")
  (when (dom/has-class? node "ls-table-row")
    (.blur node)))

(defn- set-selection-blocks-aux!
  [blocks]
  (set-state! :view/selected-blocks nil)
  (let [selected-blocks (get-state :selection/blocks)
        selected-ids (set (get-selected-block-ids selected-blocks))
        _ (set-state! :selection/blocks blocks)
        new-ids (set (get-selection-block-ids))
        removed (set/difference selected-ids new-ids)]
    (mark-dom-blocks-as-selected blocks)
    (doseq [id removed]
      (doseq [node (dom/sel (util/format "[blockid='%s']" id))]
        (unselect-node node)))))

(defn set-selection-blocks!
  ([blocks]
   (set-selection-blocks! blocks nil))
  ([blocks direction]
   (when (seq blocks)
     (let [blocks (->> blocks
                       (remove nil?)
                       (remove (fn [block]
                                 (when-let [id (some-> block (dom/attr "blockid"))]
                                   (when-let [conn (db-conn-state/get-conn (get-current-repo))]
                                     (when-let [entity (d/entity @conn [:block/uuid (uuid id)])]
                                       (ldb/recycled? entity))))))
                       vec)]
       (set-selection-blocks-aux! blocks)
       (when direction (set-state! :selection/direction direction))
       (let [ids (get-selection-block-ids)]
         (when (seq ids) (pub-event! [:editor/load-blocks ids])))))))

(defn state-clear-selection!
  []
  (set-state! :selection/blocks nil)
  (set-state! :selection/direction nil)
  (set-state! :selection/start-block nil)
  (set-state! :selection/selected-all? false)
  (pub-event! [:editor/hide-action-bar]))

(defn clear-selection!
  []
  (dom-clear-selection!)
  (state-clear-selection!))

(defn get-selection-start-block-or-first
  []
  (or (get-selection-start-block)
      (some-> (first (get-selection-blocks))
              (gobj/get "id"))))

(defn selection?
  "True sense of selection mode with valid selected block"
  []
  (seq (get-selection-blocks)))

(defn conj-selection-block!
  ([block-or-blocks]
   (conj-selection-block! block-or-blocks (get-selection-direction)))
  ([block-or-blocks direction]
   (let [selection-blocks (get-unsorted-selection-blocks)
         block-or-blocks (if (sequential? block-or-blocks) block-or-blocks [block-or-blocks])
         blocks (-> (concat selection-blocks block-or-blocks)
                    distinct)]
     (set-selection-blocks! blocks direction))))

(defn drop-selection-block!
  [block]
  (set-selection-blocks-aux! (-> (remove #(= (.-id block) (.-id %)) (get-unsorted-selection-blocks))
                                 vec)))

(defn drop-selection-blocks-starts-with!
  [block]
  (let [blocks (get-unsorted-selection-blocks)
        blocks' (-> (take-while (fn [b] (not= (.-id b) (.-id block))) blocks)
                    vec
                    (conj block))]
    (set-selection-blocks-aux! blocks')))

(defn drop-last-selection-block!
  []
  (let [blocks (get-state :selection/blocks)
        blocks' (vec (butlast blocks))]
    (set-selection-blocks-aux! blocks')
    (last blocks)))

(defn hide-custom-context-menu!
  []
  (swap-state! assoc
         :custom-context-menu/show? false
         :custom-context-menu/links nil
         :custom-context-menu/position nil))

(defn toggle-navigation-item-collapsed!
  [item]
  (update-state! [:ui/navigation-item-collapsed? item] not))

(declare sidebar-add-block!)
(defn- sidebar-add-content-when-open!
  []
  (when (empty? (:sidebar/blocks @state))
    (sidebar-add-block! (get-current-repo) "contents" :contents)))

(defn open-right-sidebar!
  []
  (sidebar-add-content-when-open!)
  (swap-state! assoc :ui/sidebar-open? true))

(defn hide-right-sidebar!
  []
  (swap-state! assoc :ui/sidebar-open? false))

(defn toggle-sidebar-open?!
  []
  (if (:ui/sidebar-open? @state)
    (hide-right-sidebar!)
    (open-right-sidebar!)))

(defn sidebar-move-block!
  [from to]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (let [to (if (> from to) (inc to) to)]
                                     (if (not= to from)
                                       (let [item (nth blocks from)
                                             blocks (keep-indexed #(when (not= %1 from) %2) blocks)
                                             [l r] (split-at to blocks)]
                                         (concat l [item] r))
                                       blocks)))))

(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (if (string? idx)
                                     (remove #(= (second %) idx) blocks)
                                     (util/drop-nth idx blocks))))
  (when (empty? (:sidebar/blocks @state))
    (hide-right-sidebar!)))

(defn sidebar-remove-deleted-block!
  [ids]
  (let [ids-set (set ids)]
    (update-state! :sidebar/blocks (fn [items]
                                     (remove (fn [[repo id _]]
                                               (and (= repo (get-current-repo)) (contains? ids-set id))) items)))
    (when (empty? (:sidebar/blocks @state))
      (hide-right-sidebar!))))

(defn sidebar-remove-rest!
  [db-id]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (remove #(not= (second %) db-id) blocks)))
  (set-state! [:ui/sidebar-collapsed-blocks db-id] false))

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

(defn sidebar-block-collapse-rest!
  [db-id]
  (let [items (disj (set (map second (:sidebar/blocks @state))) db-id)]
    (doseq [item items] (set-state! [:ui/sidebar-collapsed-blocks item] true))))

(defn sidebar-block-set-collapsed-all!
  [collapsed?]
  (let [items (map second (:sidebar/blocks @state))]
    (doseq [item items]
      (set-state! [:ui/sidebar-collapsed-blocks item] collapsed?))))

(defn clear-editor-last-pos!
  []
  (set-state! :editor/last-saved-cursor {}))

(defn clear-cursor-range!
  []
  (set-state! :editor/cursor-range nil))

(defn clear-edit!
  [& {:keys [clear-editing-block?]
      :or {clear-editing-block? true}}]
  (clear-editor-action!)
  (when clear-editing-block?
    (set-state! :editor/editing? nil)
    (set-state! :editor/block nil))
  (set-state! :editor/args nil)
  (when clear-editing-block?
    (let [online-users (some-> (get-state :rtc/state) :online-users)]
      (when (and (coll? online-users) (> (count online-users) 1))
        (pub-event! [:rtc/presence-update {:editing-block-uuid nil}]))))
  (set-state! :editor/start-pos nil)
  (clear-editor-last-pos!)
  (clear-cursor-range!)
  (when clear-editing-block?
    (set-state! :editor/content {}))
  (set-state! :ui/select-query-cache {})
  (set-state! :editor/block-refs #{})
  (set-state! :editor/action-data nil)
  (set-state! :view/selected-blocks nil))

(defn set-editor-last-pos!
  [new-pos]
  (update-state! :editor/last-saved-cursor
                 (fn [m] (assoc m (:block/uuid (get-edit-block)) new-pos))))

(defn get-editor-last-pos
  []
  (get (get-state :editor/last-saved-cursor) (:block/uuid (get-edit-block))))

(defn set-block-content-and-last-pos!
  [edit-input-id content new-pos]
  (when edit-input-id
    (set-edit-content! edit-input-id content)
    (set-editor-last-pos! new-pos)))

(defn set-theme-mode!
  ([mode] (set-theme-mode! mode (:ui/system-theme? @state)))
  ([mode system-theme?]
   (when (mobile-util/native-platform?)
     (if (= mode "light")
       (util/set-theme-light)
       (util/set-theme-dark)))
   (when (mobile-util/native-platform?)
     (mobile-util/set-native-interface-style! mode system-theme?))
   (set-state! :ui/theme mode)
   (storage/set :ui/theme mode)))

(defn sync-system-theme!
  []
  (when (:ui/system-theme? @state)
    (let [system-dark? (.-matches (js/window.matchMedia "(prefers-color-scheme: dark)"))]
      (set-theme-mode! (if system-dark? "dark" "light") true)
      (set-state! :ui/system-theme? true)
      (storage/set :ui/system-theme? true))))

(defn use-theme-mode!
  [theme-mode]
  (if (= theme-mode "system")
    (do
      (set-state! :ui/system-theme? true)
      (storage/set :ui/system-theme? true)
      (sync-system-theme!))
    (do
      (set-state! :ui/system-theme? false)
      (storage/set :ui/system-theme? false)
      (set-theme-mode! theme-mode false))))

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
    (when (mobile-util/native-platform?)
      (mobile-util/set-native-interface-style! mode system-theme?))
    (when (and (not system-theme?)
               (mobile-util/native-platform?))
      (if (= mode "light")
        (util/set-theme-light)
        (util/set-theme-dark)))))

(defn load-app-user-cfgs
  ([] (load-app-user-cfgs false))
  ([refresh?]
   (when (util/electron?)
     (p/let [cfgs (if (or refresh? (nil? (:electron/user-cfgs @state)))
                    (ipc/ipc :userAppCfgs)
                    (:electron/user-cfgs @state))
             cfgs (if (object? cfgs) (bean/->clj cfgs) cfgs)]
       (set-state! :electron/user-cfgs cfgs)))))

(defn load-electron-app-base-info
  []
  (when (util/electron?)
    (p/let [info (ipc/ipc :getAppBaseInfo)
            info (if (object? info) (bean/->clj info) info)]
      (set-state! :electron/app-base-info info))))

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

(defn clear-file-component!
  []
  (set-state! :ui/file-component nil))

(defn save-scroll-position!
  ([value]
   (save-scroll-position! value js/window.location.hash))
  ([value path]
   (set-state! :ui/paths-scroll-positions value :nested-path path)))

(defn save-main-container-position!
  [value]
  (when (not= value (get-state :ui/main-container-scroll-top))
    (set-state! :ui/main-container-scroll-top value)))

(defn get-saved-scroll-position
  ([]
   (get-saved-scroll-position js/window.location.hash))
  ([path]
   (get (get-state :ui/paths-scroll-positions) path 0)))

(defn set-today!
  [value]
  (set-state! :today value))

(defn get-me
  []
  (:me @state))

(defn set-db-restoring!
  [value]
  (set-state! :db/restoring? value))

(defn dialog-opened?
  []
  (shui-dialog/has-dialog?))

(defn close-dialog! []
  (shui/dialog-close!))

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

(defn document-mode?
  []
  (get-state :document/mode?))

(defn toggle-document-mode!
  []
  (let [mode (document-mode?)]
    (set-state! :document/mode? (not mode))
    (storage/set :document/mode? (not mode))))

(defn toggle-highlight-recent-blocks!
  []
  (let [value (get-state :ui/toggle-highlight-recent-blocks?)]
    (set-state! :ui/toggle-highlight-recent-blocks? (not value))))

(defn shortcut-tooltip-enabled?
  []
  (get-state :ui/shortcut-tooltip?))

(defn toggle-shortcut-tooltip!
  []
  (let [mode (shortcut-tooltip-enabled?)]
    (set-state! :ui/shortcut-tooltip? (not mode))
    (storage/set :ui/shortcut-tooltip? (not mode))))

(defn set-config!
  [repo-url value]
  (when value (set-state! [:config repo-url] value)))

(defn set-global-config!
  [value str-content]
  ;; Placed under :config so cursors can work seamlessly
  (when value
    (set-config! ::global-config value)
    (set-config! ::global-config-str-content str-content)))

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
  (->> (apply concat (vals (:plugin/simple-commands @state)))
       (filterv #(= (keyword (first %)) (keyword type)))))

(defn get-plugins-ui-items-with-type
  [type]
  (->> (apply concat (vals (:plugin/installed-ui-items @state)))
       (filterv #(= (keyword (first %)) (keyword type)))))

(defn get-plugin-resources-with-type
  [pid type]
  (when-let [pid (and type (keyword pid))]
    (get-in @state [:plugin/installed-resources pid (keyword type)])))

(defn get-plugin-resource
  [pid type key]
  (when-let [resources (get-plugin-resources-with-type pid type)]
    (some->> key (keyword) (get resources))))

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
      (swap-state! update :plugin/installed-hooks #(update-vals % (fn [ids] (dissoc ids pid))))
      (when-let [coll (get-in @state [:plugin/installed-hooks hook-or-all])]
        (set-state! [:plugin/installed-hooks hook-or-all] (dissoc coll pid))))
    true))

(defn slot-hook-exist?
  [uuid]
  (when-let [type (and uuid (string/replace (str uuid) "-" "_"))]
    (when-let [hooks (get-state :plugin/installed-hooks)]
      (contains? hooks (str "hook:editor:slot_" type)))))

(defn set-editor-in-composition!
  [value]
  (set-state! :editor/in-composition? value))

(defn editor-in-composition?
  []
  (:editor/in-composition? @state))

(defn set-editor-last-input-time!
  [repo time]
  (set-state! :editor/last-input-time time :nested-path repo))

(defn input-idle?
  [repo & {:keys [diff]
           :or {diff 1000}}]
  (when repo
    (let [last-input-time (get (get-state :editor/last-input-time) repo)]
      (or
       (nil? last-input-time)

       (let [now (util/time-ms)]
         (>= (- now last-input-time) diff))

       ;; not in editing mode
       (not (get-edit-input-id))))))

(defn set-search-result!
  [value]
  (set-state! :search/result value))

(defn clear-search-result!
  []
  (set-search-result! nil))

(defn get-search-mode
  []
  (:search/mode @state))

(defn toggle!
  [path]
  (update-state! path not))

(defn toggle-settings!
  []
  (toggle! :ui/settings-open?))

(defn close-settings!
  []
  (set-state! :ui/settings-open? false))

(defn open-settings!
  ([] (open-settings! true))
  ([active-tab] (set-state! :ui/settings-open? active-tab)))

(defn sidebar-add-block!
  [repo db-id block-type]
  (when (not (util/sm-breakpoint?))
    (let [page (and (= :page block-type)
                    (some-> (db-conn-state/get-conn repo) deref (d/entity db-id)))]
      (if (and page
               ;; TODO: Use config/dev? when it's not a circular dep
               (not goog.DEBUG)
               (not= common-config/recycle-page-name (:block/title page))
               (or (and (ldb/hidden? page) (not (ldb/property? page)))
                   (and (ldb/built-in? page) (ldb/private-built-in-page? page))))
        (pub-event! [:notification/show {:content "Cannot open an internal page." :status :warning}])
        (when db-id
          (update-state! :sidebar/blocks (fn [blocks]
                                           (->> (remove #(= (second %) db-id) blocks)
                                                (cons [repo db-id block-type])
                                                (distinct))))
          (set-state! [:ui/sidebar-collapsed-blocks db-id] false)
          (open-right-sidebar!)
          (when-let [elem (gdom/getElementByClass "sidebar-item-list")]
            (util/scroll-to elem 0)))))))

(defn get-export-block-text-indent-style []
  (normalize-export-block-text-indent-style (:copy/export-block-text-indent-style @state)))

(defn set-export-block-text-indent-style!
  [v]
  (let [v* (normalize-export-block-text-indent-style v)]
    (set-state! :copy/export-block-text-indent-style v*)
    (storage/set :copy/export-block-text-indent-style v*)))

(defn get-recent-pages
  []
  (get-in @state [:ui/recent-pages (get-current-repo)]))

(defn set-recent-pages!
  [v]
  (set-state! [:ui/recent-pages (get-current-repo)] v)
  (storage/set :ui/recent-pages (:ui/recent-pages @state)))

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

(defn block-component-editing?
  []
  (:block/component-editing-mode? @state))

(defn set-block-component-editing-mode!
  [value]
  (set-state! :block/component-editing-mode? value))

(defn get-editor-args
  []
  (get-state :editor/args))

(defn get-editor-block-container
  []
  (some-> (get-edit-input-id)
          (gdom/getElement)
          (util/rec-get-node "ls-block")))

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
   (exit-editing-and-set-selected-blocks! blocks nil))
  ([blocks direction]
   (clear-edit!)
   (set-selection-blocks! blocks direction)))

(defn set-editing!
  [edit-input-id content block cursor-range & {:keys [db move-cursor? container-id property-block direction event pos]
                                               :or {move-cursor? true}}]
  (when-not (exists? js/process)
    (when (and edit-input-id block
               (or
                (publishing-enable-editing?)
                (not common-config/PUBLISHING)))
      (let [block-element (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block"))
            container (util/get-block-container block-element)
            block (if container
                    (assoc block
                           :block.temp/container (gobj/get container "id"))
                    block)
            block (assoc block :block.editing/direction direction
                         :block.editing/event event
                         :block.editing/pos pos)
            content (string/trim (or content ""))]
        (assert (and container-id (:block/uuid block))
                "container-id or block uuid is missing")
        (set-state! :editor/block-refs #{})
        (set-state! :editor/block block)
        (if property-block
          (set-editing-block-id! [container-id (:block/uuid property-block) (:block/uuid block)])
          (set-editing-block-id! [container-id (:block/uuid block)]))
        (set-state! :editor/container-id container-id)
        (set-state! :editor/content content :nested-path (:block/uuid block))
        (set-state! :editor/last-key-code nil)
        (set-state! :editor/set-timestamp-block nil)
        (set-state! :editor/cursor-range cursor-range)
        (let [online-users (some-> (get-state :rtc/state) :online-users)]
          (when (and (coll? online-users) (> (count online-users) 1))
            (when-let [block-uuid (:block/uuid block)]
              (pub-event! [:rtc/presence-update {:editing-block-uuid (str block-uuid)}]))))
        (when (= :code (:logseq.property.node/display-type (d/entity db (:db/id block))))
          (pub-event! [:editor/focus-code-editor block block-element]))
        (when-let [input (gdom/getElement edit-input-id)]
          (let [pos (count cursor-range)]
            (when content
              (util/set-change-value input content))

            (when (and move-cursor? (not (block-component-editing?)))
              (cursor/move-cursor-to input pos))

            (when (mobile-util/native-platform?)
              (set-state! :mobile/show-action-bar? false))))))))

(defn set-last-key-code!
  [key-code]
  (set-state! :editor/last-key-code key-code))

(defn get-last-key-code
  []
  (get-state :editor/last-key-code))

(defn set-ui-last-key-code!
  [key-code]
  (set-state! :ui/global-last-key-code key-code))

(defn get-ui-last-key-code
  []
  (get-state :ui/global-last-key-code))

(defn set-block-op-type!
  [op-type]
  (set-state! :editor/block-op-type op-type))

(defn get-block-op-type
  []
  (:editor/block-op-type @state))

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
    #(and (if include-unpacked? true (or (:webMode %) (:iir %)))
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
      (swap-state! update :plugin/updates-pending dissoc id)
      (if updated?
        (if-let [error (:error-code payload)]
          (swap-state! update-in [:plugin/updates-coming id] assoc :error-code error)
          (swap-state! update :plugin/updates-coming dissoc id))
        (swap-state! update :plugin/updates-coming assoc id payload))
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
  (swap-state! update :plugin/updates-unchecked (if unchecked? conj disj) id))

(defn reset-unchecked-update
  []
  (swap-state! assoc :plugin/updates-unchecked #{}))

(defn reset-all-updates-state
  []
  (swap-state! assoc
         :plugin/updates-auto-checking?         false
         :plugin/updates-pending                {}
         :plugin/updates-coming                 {}
         :plugin/updates-downloading?           false))

(defn use-right-sidebar-blocks
  []
  (let [current-repo (rfx/use-sub [:git/current-repo])
        blocks (rfx/use-sub [:sidebar/blocks])]
    (when current-repo
      (filter #(= (first %) current-repo) blocks))))

(defn get-current-editor-container-id
  []
  (get-state :editor/container-id))

(defn resolve-container-id
  [container-id]
  (or container-id (get-current-editor-container-id) :unknown-container))

(defn toggle-collapsed-block!
  ([block-id] (toggle-collapsed-block! block-id nil))
  ([block-id container-id]
   (let [current-repo (get-current-repo)
         container-id (resolve-container-id container-id)]
     (update-state! [:ui/collapsed-blocks current-repo container-id block-id] not))))

(defn set-collapsed-block!
  ([block-id value] (set-collapsed-block! block-id value nil))
  ([block-id value container-id]
   (let [current-repo (get-current-repo)
         container-id (resolve-container-id container-id)]
     (set-state! [:ui/collapsed-blocks current-repo container-id block-id] value))))

(defn get-block-collapsed
  ([block-id] (get-block-collapsed block-id nil))
  ([block-id container-id]
   (get-in @state [:ui/collapsed-blocks (get-current-repo) (resolve-container-id container-id) block-id])))

(defn get-dialog-id
  []
  (shui-dialog/get-last-dialog-id))

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
  (get-state :auth/id-token))

(defn get-auth-refresh-token []
  (:auth/refresh-token @state))

(defn http-proxy-enabled-or-val? []
  (when-let [{:keys [type protocol host port]} (get-state [:electron/user-cfgs :settings/agent])]
    ;; Older saved proxy settings may only have :protocol.
    (let [proxy-type (or type protocol)]
      (when (and (contains? #{"http" "socks5"} proxy-type)
                 (every? not-empty [proxy-type host port]))
        (str proxy-type "://" host ":" port)))))

(defn get-current-pdf
  []
  (:pdf/current @state))

(defn set-current-pdf!
  [inflated-file]
  (let [settle-file! #(set-state! :pdf/current inflated-file)]
    (if-not (get-current-pdf)
      (settle-file!)
      (when (apply not= (map :identity [inflated-file (get-current-pdf)]))
        (set-state! :pdf/current nil)
        (js/setTimeout #(settle-file!) 16)))))

(defn set-user-info!
  [info]
  (when info
    (set-state! :user/info info)
    (let [groups (:UserGroups info)]
      (when (seq groups)
        (storage/set :user-groups groups)))))

(defn clear-user-info!
  []
  (storage/remove :user-groups))

(defn set-color-accent! [color]
  (swap-state! assoc :ui/radix-color color)
  (storage/set :ui/radix-color color))

(defn set-editor-font! [config]
  (let [config' (:ui/editor-font @state)
        config (if (map? config') (merge config' config) {})]
    (swap-state! assoc :ui/editor-font config)
    (storage/set :ui/editor-font config)))

(defn handbook-open?
  []
  (:ui/handbooks-open? @state))

(defn get-handbook-route-chan
  []
  (:handbook/route-chan @state))

(defn open-handbook-pane!
  [k]
  (when-not (handbook-open?)
    (set-state! :ui/handbooks-open? true))
  (js/setTimeout #(async/go
                    (>! (get-handbook-route-chan) k))))

(defn update-favorites-updated!
  []
  (update-state! :favorites/updated? inc))

(defn get-next-container-id
  []
  (let [next-id (inc (or (get-state :ui/container-id) 0))]
    (set-state! :ui/container-id next-id)
    next-id))

(defn get-container-id
  "Either cached container-id or a new id"
  [key]
  (if (seq key)
    (or (get (get-state :ui/cached-key->container-id) key)
        (let [id (get-next-container-id)]
          (update-state! :ui/cached-key->container-id assoc key id)
          id))
    (get-next-container-id)))

(defn use-container-id
  "Return a stable container id for the component lifetime."
  ([]
   (use-container-id nil))
  ([key]
   (hooks/use-memo #(get-container-id key) [key])))

(comment
  (defn remove-container-key!
    [key]
    (update-state! :ui/cached-key->container-id dissoc key)))

(defn get-editor-info
  []
  (let [selected-block-uuids (some-> (get-selection-block-ids) seq vec)
        selection-info (when selected-block-uuids
                         {:selected-block-uuids selected-block-uuids
                          :selection-direction (get-selection-direction)})]
    (if-let [edit-block (get-edit-block)]
      (cond-> {:block-uuid (:block/uuid edit-block)
               :container-id (or (get-state :editor/container-id) :unknown-container)
               :start-pos (get-state :editor/start-pos)
               :end-pos (get-edit-pos)}
        selection-info
        (merge selection-info))
      selection-info)))

(defn conj-block-ref!
  [ref-entity]
  (update-state! :editor/block-refs conj ref-entity))

(defn get-highlight-recent-days
  []
  (get-state :ui/highlight-recent-days))

(defn set-highlight-recent-days!
  [days]
  (set-state! :ui/highlight-recent-days days)
  (storage/set :ui/highlight-recent-days days))

(defn set-db-worker-client-id!
  [new-id]
  (when new-id
    (reset! *db-worker-client-id new-id)
    (storage/set :db-worker-client-id new-id)))
