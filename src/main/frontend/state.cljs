(ns frontend.state
  (:require [cljs-bean.core :as bean]
            [cljs.core.async :as async]
            [clojure.string :as string]
            [cljs.spec.alpha :as s]
            [dommy.core :as dom]
            [medley.core :as medley]
            [electron.ipc :as ipc]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]))

(defonce ^:large-vars/data-var state
  (let [document-mode? (or (storage/get :document/mode?) false)
       current-graph (let [graph (storage/get :git/current-repo)]
                       (when graph (ipc/ipc "setCurrentGraph" graph))
                       graph)]
   (atom
    {:route-match                           nil
     :today                                 nil
     :system/events                         (async/chan 100)
     :db/batch-txs                          (async/chan 100)
     :file/writes                           (async/chan 100)
     :reactive/custom-queries               (async/chan 100)
     :notification/show?                    false
     :notification/content                  nil
     :repo/loading-files?                   {}
     :nfs/user-granted?                     {}
     :nfs/refreshing?                       nil
     :instrument/disabled?                  (storage/get "instrument-disabled")
     ;; TODO: how to detect the network reliably?
     :network/online?                       true
     :indexeddb/support?                    true
     :me                                    nil
     :git/current-repo                      current-graph
     :format/loading                        {}
     :draw?                                 false
     :db/restoring?                         nil

     :journals-length                       3

     :search/q                              ""
     :search/mode                           :global
     :search/result                         nil
     :search/graph-filters                  []

     ;; modals
     :modal/id                              nil
     :modal/label                           ""
     :modal/show?                           false
     :modal/panel-content                   nil
     :modal/fullscreen?                     false
     :modal/close-btn?                      nil
     :modal/subsets                         []

     ;; right sidebar
     :ui/fullscreen?                        false
     :ui/settings-open?                     false
     :ui/sidebar-open?                      false
     :ui/left-sidebar-open?                 (boolean (storage/get "ls-left-sidebar-open?"))
     :ui/theme                              (or (storage/get :ui/theme) (if (mobile-util/is-native-platform?) "light" "dark"))
     :ui/system-theme?                      ((fnil identity (or util/mac? util/win32? false)) (storage/get :ui/system-theme?))
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
     :ui/custom-query-components            {}
     :ui/show-recent?                       false
     :ui/command-palette-open?              false
     :ui/developer-mode?                    (or (= (storage/get "developer-mode") "true")
                                                false)
     ;; remember scroll positions of visited paths
     :ui/paths-scroll-positions             {}
     :ui/shortcut-tooltip?                  (if (false? (storage/get :ui/shortcut-tooltip?))
                                              false
                                              true)
     :ui/visual-viewport-pending?           false
     :ui/visual-viewport-state              nil

     :document/mode?                        document-mode?

     :config                                {}
     :block/component-editing-mode?         false
     :editor/draw-mode?                     false
     :editor/show-page-search?              false
     :editor/show-page-search-hashtag?      false
     :editor/show-date-picker?              false
     ;; With label or other data
     :editor/show-input                     nil
     :editor/show-zotero                    false
     :editor/last-saved-cursor              nil
     :editor/editing?                       nil
     :editor/in-composition?                false
     :editor/content                        {}
     :editor/block                          nil
     :editor/block-dom-id                   nil
     :editor/set-timestamp-block            nil
     :editor/last-input-time                nil
     :editor/document-mode?                 document-mode?
     :editor/args                           nil
     :editor/on-paste?                      false
     :editor/last-key-code                  nil
     :editor/editing-page-title?            false

     ;; for audio record
     :editor/record-status                  "NONE"

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
     :custom-context-menu/show?             false
     :custom-context-menu/links             nil

     ;; pages or blocks in the right sidebar
     ;; It is a list of `[repo db-id block-type block-data]` 4-tuple
     :sidebar/blocks                        '()

     :preferred-language                    (storage/get :preferred-language)

     ;; electron
     :electron/auto-updater-downloaded      false
     :electron/updater-pending?             false
     :electron/updater                      {}
     :electron/user-cfgs                    nil

     ;; mobile
     :mobile/show-action-bar?               false
     :mobile/actioned-block                 nil
     ;; plugin
     :plugin/enabled                        (and (util/electron?)
                                                 ;; true false :theme-only
                                                 ((fnil identity true) (storage/get :lsp-core-enabled)))
     :plugin/indicator-text                 nil
     :plugin/installed-plugins              {}
     :plugin/installed-themes               []
     :plugin/installed-slash-commands       {}
     :plugin/installed-ui-items             {}
     :plugin/installed-resources            {}
     :plugin/installed-hooks                {}
     :plugin/simple-commands                {}
     :plugin/selected-theme                 nil
     :plugin/selected-unpacked-pkg          nil
     :plugin/marketplace-pkgs               nil
     :plugin/marketplace-stats              nil
     :plugin/installing                     nil
     :plugin/active-readme                  nil
     :plugin/updates-pending                {}
     :plugin/updates-coming                 {}
     :plugin/updates-downloading?           false
     :plugin/updates-unchecked              #{}
     :plugin/navs-settings?                 true
     :plugin/focused-settings               nil ;; plugin id

     ;; pdf
     :pdf/current                           nil
     :pdf/ref-highlight                     nil

     ;; all notification contents as k-v pairs
     :notification/contents                 {}
     :graph/syncing?                        false
     ;; graph -> state
     :graph/parsing-state                   {}

     ;; copied blocks
     :copy/blocks                           {:copy/content nil :copy/block-ids nil}

     :copy/export-block-text-indent-style   (or (storage/get :copy/export-block-text-indent-style)
                                                "dashes")
     :copy/export-block-text-remove-options (or (storage/get :copy/export-block-text-remove-options)
                                                #{})
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
     :auth/refresh-token                    nil
     :auth/access-token                     nil
     :auth/id-token                         nil

     ;; file-sync
     :file-sync/sync-manager                nil
     :file-sync/sync-state-manager          nil
     :file-sync/sync-state                  nil
     :file-sync/sync-uploading-files        nil
     :file-sync/sync-downloading-files      nil
     })))

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

(defn sub
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

(defn get-route-match
  []
  (:route-match @state))

(defn get-current-route
  []
  (get-in (get-route-match) [:data :name]))

(defn home?
  []
  (= :home (get-current-route)))

(defn setups-picker?
  []
  (= :repo-add (get-current-route)))

(defn get-current-page
  []
  (when (= :page (get-current-route))
    (get-in (get-route-match)
            [:path-params :name])))

(defn route-has-p?
  []
  (get-in (get-route-match) [:query-params :p]))

(defn set-state!
  [path value]
  (if (vector? path)
    (swap! state assoc-in path value)
    (swap! state assoc path value)))

(defn update-state!
  [path f]
  (if (vector? path)
    (swap! state update-in path f)
    (swap! state update path f)))

(defn get-current-repo
  []
  (or (:git/current-repo @state)
      (when-not (mobile-util/is-native-platform?)
        "local")))

(defn get-config
  ([]
   (get-config (get-current-repo)))
  ([repo-url]
   (get-in @state [:config repo-url])))

(def default-arweave-gateway "https://arweave.net")

(defn get-arweave-gateway
  []
  (:arweave/gateway (get-config) default-arweave-gateway))

(defonce built-in-macros
         {"img" "[:img.$4 {:src \"$1\" :style {:width $2 :height $3}}]"})

(defn get-macros
  []
  (merge
    built-in-macros
    (:macros (get-config))))

(defn sub-config
  []
  (sub :config))

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

(defn enable-grammarly?
  []
  (true? (:feature/enable-grammarly?
           (get (sub-config) (get-current-repo)))))

;; (defn store-block-id-in-file?
;;   []
;;   (true? (:block/store-id-in-file? (get-config))))

(defn scheduled-deadlines-disabled?
  []
  (true? (:feature/disable-scheduled-and-deadline-query?
           (get (sub-config) (get-current-repo)))))

(defn enable-timetracking?
  []
  (not (false? (:feature/enable-timetracking?
                 (get (sub-config) (get-current-repo))))))

(defn enable-journals?
  [repo]
  (not (false? (:feature/enable-journals?
                 (get (sub-config) repo)))))

(defn export-heading-to-list?
  []
  (not (false? (:export/heading-to-list?
                 (get (sub-config) (get-current-repo))))))

(defn enable-git-auto-push?
  [repo]
  (not (false? (:git-auto-push
                 (get (sub-config) repo)))))

(defn enable-block-timestamps?
  []
  (true? (:feature/enable-block-timestamps?
           (get (sub-config) (get-current-repo)))))

(defn sub-graph-config
  []
  (get (sub-config) (get-current-repo)))

(defn sub-graph-config-settings
  []
  (:graph/settings (sub-graph-config)))

;; Enable by default
(defn show-brackets?
  []
  (not (false? (:ui/show-brackets?
                 (get (sub-config) (get-current-repo))))))

(defn get-default-home
  []
  (:default-home (get-config)))

(defn sub-default-home-page
  []
  (get-in (sub-config) [(get-current-repo) :default-home :page] ""))

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

;; TODO: consider adding a pane in Settings to set this through the GUI (rather
;; than having to go through the config.edn file)
(defn get-editor-command-trigger
  ([] (get-editor-command-trigger (get-current-repo)))
  ([repo-url]
   (or
     (:editor/command-trigger (get-config repo-url))        ;; Get from user config
     "/")))                                                 ;; Set the default

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

(defn page-name-order
  "Decide whether to use file name or :title as page name. If it returns \"file\", use the file
  name unless it is missing."
  []
  (:page-name-order (get-config)))

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
           (->> (remove #(= (:url repo)
                            (:url %))
                        repos)
                (util/distinct-by :url))))
  (when (= (get-current-repo) (:url repo))
    (set-current-repo! (:url (first (get-repos))))))

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

(defn sub-edit-content
  []
  (sub [:editor/content (get-edit-input-id)]))

(defn append-current-edit-content!
  [append-text]
  (when-not (string/blank? append-text)
    (when-let [input-id (get-edit-input-id)]
      (when-let [input (gdom/getElement input-id)]
        (let [value (gobj/get input "value")
              new-value (str value append-text)
              new-value (if (or (= (last value) " ")
                                (= (last value) "\n"))
                          new-value
                          (str "\n" new-value))]
          (js/document.execCommand "insertText" false append-text)
          (update-state! :editor/content (fn [m]
                                           (assoc m input-id new-value))))))))

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

(defn set-editor-show-page-search!
  [value]
  (set-state! :editor/show-page-search? value))

(defn get-editor-show-page-search?
  []
  (get @state :editor/show-page-search?))

(defn set-editor-show-page-search-hashtag!
  [value]
  (set-state! :editor/show-page-search? value)
  (set-state! :editor/show-page-search-hashtag? value))
(defn get-editor-show-page-search-hashtag?
  []
  (get @state :editor/show-page-search-hashtag?))
(defn set-editor-show-block-search!
  [value]
  (set-state! :editor/show-block-search? value))
(defn get-editor-show-block-search?
  []
  (get @state :editor/show-block-search?))
(defn set-editor-show-template-search!
  [value]
  (set-state! :editor/show-template-search? value))
(defn get-editor-show-template-search?
  []
  (get @state :editor/show-template-search?))
(defn set-editor-show-date-picker!
  [value]
  (set-state! :editor/show-date-picker? value))
(defn get-editor-show-date-picker?
  []
  (get @state :editor/show-date-picker?))
(defn set-editor-show-input!
  [value]
  (set-state! :editor/show-input value))
(defn get-editor-show-input
  []
  (get @state :editor/show-input))


(defn set-editor-show-zotero!
  [value]
  (set-state! :editor/show-zotero value))

;; TODO: refactor, use one state
(defn clear-editor-show-state!
  []
  (swap! state (fn [state]
                 (assoc state
                        :editor/show-input nil
                        :editor/show-zotero false
                        :editor/show-date-picker? false
                        :editor/show-block-search? false
                        :editor/show-template-search? false
                        :editor/show-page-search? false
                        :editor/show-page-search-hashtag? false))))

(defn set-edit-input-id!
  [input-id]
  (swap! state update :editor/editing?
         (fn [_m]
           (and input-id {input-id true}))))

(defn get-edit-pos
  []
  (when-let [input (get-input)]
    (util/get-selection-start input)))

(defn set-selection-start-block!
  [start-block]
  (swap! state assoc :selection/start-block start-block))

(defn get-selection-start-block
  []
  (get @state :selection/start-block))

(defn set-selection-blocks!
  ([blocks]
   (set-selection-blocks! blocks :down))
  ([blocks direction]
   (when (seq blocks)
     (let [blocks (util/sort-by-height blocks)]
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
         :selection/direction :down))

(defn get-selection-blocks
  []
  (:selection/blocks @state))

(defn get-selection-block-ids
  []
  (->> (sub :selection/blocks)
       (keep #(when-let [id (dom/attr % "blockid")]
                (uuid id)))
       (distinct)))

(defn in-selection-mode?
  []
  (:selection/mode @state))

(defn selection?
  "True sense of selection mode with valid selected block"
  []
  (and (in-selection-mode?) (seq (get-selection-blocks))))

(defn conj-selection-block!
  [block direction]
  (dom/add-class! block "selected noselect")
  (swap! state assoc
         :selection/mode true
         :selection/blocks (-> (conj (vec (:selection/blocks @state)) block)
                               (util/sort-by-height))
         :selection/direction direction))

(defn drop-last-selection-block!
  []
  (let [last-block (peek (vec (:selection/blocks @state)))]
    (swap! state assoc
           :selection/mode true
           :selection/blocks (pop (vec (:selection/blocks @state))))
    last-block))

(defn get-selection-direction
  []
  (:selection/direction @state))

(defn show-custom-context-menu!
  [links]
  (swap! state assoc
         :custom-context-menu/show? true
         :custom-context-menu/links links))

(defn hide-custom-context-menu!
  []
  (swap! state assoc
         :custom-context-menu/show? false
         :custom-context-menu/links nil))

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
  [repo db-id block-type block-data]
  (when (not (util/sm-breakpoint?))
    (when db-id
      (update-state! :sidebar/blocks (fn [blocks]
                                       (->> (remove #(= (second %) db-id) blocks)
                                            (cons [repo db-id block-type block-data])
                                            (distinct))))
      (open-right-sidebar!)
      (when-let [elem (gdom/getElementByClass "cp__right-sidebar-scrollable")]
        (util/scroll-to elem 0)))))

(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (if (string? idx)
                                     (remove #(= (second %) idx) blocks)
                                     (util/drop-nth idx blocks))))
  (when (empty? (:sidebar/blocks @state))
    (hide-right-sidebar!)))

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
       :pos             (cursor/pos (gdom/getElement edit-input-id))})))

(defonce publishing? (atom nil))

(defn publishing-enable-editing?
  []
  (and @publishing? (:publishing/enable-editing? (get-config))))

(defn enable-editing?
  []
  (or (not @publishing?) (:publishing/enable-editing? (get-config))))

(defn set-editing!
  ([edit-input-id content block cursor-range]
   (set-editing! edit-input-id content block cursor-range true))
  ([edit-input-id content block cursor-range move-cursor?]
   (when (and edit-input-id block
              (or
                (publishing-enable-editing?)
                (not @publishing?)))
     (let [block-element (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block"))
           container (util/get-block-container block-element)
           block (if container
                   (assoc block
                     :block/container (gobj/get container "id"))
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
                     :cursor-range cursor-range))))
       (when-let [input (gdom/getElement edit-input-id)]
         (let [pos (count cursor-range)]
           (when content
             (util/set-change-value input content))

           (when move-cursor?
             (cursor/move-cursor-to input pos))

           (when (or (util/mobile?) (mobile-util/is-native-platform?))
             (set-state! :mobile/show-action-bar? false)
             (util/make-el-center-if-near-top input))))))))

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

(defn set-theme!
  [theme]
  (set-state! :ui/theme theme)
  (when (mobile-util/native-ios?)
    (if (= theme "light")
      (util/set-theme-light)
      (util/set-theme-dark)))
  (storage/set :ui/theme theme))

(defn sync-system-theme!
  []
  (let [system-dark? (.-matches (js/window.matchMedia "(prefers-color-scheme: dark)"))]
    (set-theme! (if system-dark? "dark" "light"))
    (set-state! :ui/system-theme? true)
    (storage/set :ui/system-theme? true)))

(defn use-theme-mode!
  [theme-mode]
  (if-not (= theme-mode "system")
    (do
      (set-theme! theme-mode)
      (set-state! :ui/system-theme? false)
      (storage/set :ui/system-theme? false))
    (sync-system-theme!)))

(defn set-editing-block-dom-id!
  [block-dom-id]
  (set-state! :editor/block-dom-id block-dom-id))

(defn get-editing-block-dom-id
  []
  (:editor/block-dom-id @state))

(defn toggle-theme!
  []
  (let [theme (:ui/theme @state)
        theme' (if (= theme "dark") "light" "dark")]
    (use-theme-mode! theme')))

(defn set-root-component!
  [component]
  (set-state! :ui/root-component component))

(defn get-root-component
  []
  (get @state :ui/root-component))

(defn load-app-user-cfgs
  ([] (load-app-user-cfgs false))
  ([refresh?]
   (p/let [cfgs (if (or refresh? (nil? (:electron/user-cfgs @state)))
                  (ipc/ipc "userAppCfgs")
                  (:electron/user-cfgs @state))
           cfgs (if (object? cfgs) (bean/->clj cfgs) cfgs)]
          (set-state! :electron/user-cfgs cfgs))))

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

(defn get-file-component
  []
  (get @state :ui/file-component))

(defn set-journals-length!
  [value]
  (when value
    (set-state! :journals-length value)))

(defn add-custom-query-component!
  [query-string component]
  (update-state! :ui/custom-query-components
                 (fn [m]
                   (assoc m query-string component))))

(defn remove-custom-query-component!
  [query-string]
  (update-state! :ui/custom-query-components
                 (fn [m]
                   (dissoc m query-string))))

(defn get-custom-query-components
  []
  (vals (get @state :ui/custom-query-components)))

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

(defn get-date-formatter
  []
  (or
    (when-let [repo (get-current-repo)]
      (or
        (get-in @state [:config repo :journal/page-title-format])
        ;; for compatibility
        (get-in @state [:config repo :date-formatter])))
    ;; TODO:
    (get-in @state [:me :settings :date-formatter])
    "MMM do, yyyy"))

(defn shortcuts []
  (get-in @state [:config (get-current-repo) :shortcuts]))

(defn get-me
  []
  (:me @state))

(defn deprecated-logged?
  "Whether the user has logged in."
  []
  false)

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
  ([panel-content {:keys [id label close-btn? show? center?] :as opts}]
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
                    :modal/close-btn?    close-btn?})]
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
  ([modal-panel-content {:keys [id label fullscreen? close-btn? center?]}]
   (when (seq (get-sub-modals))
     (close-sub-modal! true))
   (swap! state assoc
          :modal/id id
          :modal/label (or label (if center? "ls-modal-align-center" ""))
          :modal/show? (boolean modal-panel-content)
          :modal/panel-content modal-panel-content
          :modal/fullscreen? fullscreen?
          :modal/close-btn? close-btn?)))

(defn close-modal!
  []
  (if (seq (get-sub-modals))
    (close-sub-modal!)
    (swap! state assoc
           :modal/id nil
           :modal/label ""
           :modal/show? false
           :modal/fullscreen? false
           :modal/panel-content nil
           :ui/open-select nil)))

(defn get-db-batch-txs-chan
  []
  (:db/batch-txs @state))

(defn get-file-write-chan
  []
  (:file/writes @state))

(defn get-reactive-custom-queries-chan
  []
  (:reactive/custom-queries @state))

(defn get-write-chan-length
  []
  (let [c (get-file-write-chan)]
    (count (gobj/get c "buf"))))

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

(defn doc-mode-enter-for-new-line?
  []
  (and (document-mode?)
       (not (:shortcut/doc-mode-enter-for-new-block? (sub-graph-config)))))

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

(defn enable-tooltip?
  []
  (if (or (util/mobile?) (mobile-util/is-native-platform?))
    false
    (get (get (sub-config) (get-current-repo))
         :ui/enable-tooltip?
         true)))

(defn show-command-doc?
  []
  (get (get (sub-config) (get-current-repo))
       :ui/show-command-doc?
       true))

(defn set-config!
  [repo-url value]
  (set-state! [:config repo-url] value))

(defn get-wide-mode?
  []
  (:ui/wide-mode? @state))

(defn toggle-wide-mode!
  []
  (update-state! :ui/wide-mode? not))

(defn set-online!
  [value]
  (set-state! :network/online? value))

(defn get-commands
  []
  (:commands (get-config)))

(defn get-plugins-commands
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

(defn install-plugin-hook
  [pid hook]
  (when-let [pid (keyword pid)]
    (set-state!
      [:plugin/installed-hooks hook]
      (conj
        ((fnil identity #{}) (get-in @state [:plugin/installed-hooks hook]))
        pid)) true))

(defn uninstall-plugin-hook
  [pid hook-or-all]
  (when-let [pid (keyword pid)]
    (if (nil? hook-or-all)
      (swap! state update :plugin/installed-hooks #(medley/map-vals (fn [ids] (disj ids pid)) %))
      (when-let [coll (get-in @state [:plugin/installed-hooks hook-or-all])]
        (set-state! [:plugin/installed-hooks hook-or-all] (disj coll pid))))
    true))


(defn get-scheduled-future-days
  []
  (let [days (:scheduled/future-days (get-config))]
    (or (when (int? days) days) 0)))

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
  [repo]
  (when repo
    (or
      (when-let [last-time (get-in @state [:editor/last-input-time repo])]
        (let [now (util/time-ms)]
          (>= (- now last-time) 500)))
      ;; not in editing mode
      (not (get-edit-input-id)))))

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

(defonce editor-op (atom nil))
(defn set-editor-op!
  [value]
  (reset! editor-op value))
(defn get-editor-op
  []
  @editor-op)

(defn get-start-of-week
  []
  (or
    (when-let [repo (get-current-repo)]
      (get-in @state [:config repo :start-of-week]))
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

(defn get-events-chan
  []
  (:system/events @state))

(defn pub-event!
  [payload]
  (let [chan (get-events-chan)]
    (async/put! chan payload)))

(defn get-copied-blocks
  []
  (:copy/blocks @state))

(defn set-copied-blocks
  [content ids]
  (set-state! :copy/blocks {:copy/content content
                            :copy/block-ids ids
                            :copy/full-blocks nil}))

(defn set-copied-full-blocks
  [content blocks]
  (set-state! :copy/blocks {:copy/content content
                            :copy/full-blocks blocks}))

(defn set-copied-full-blocks!
  [blocks]
  (set-state! [:copy/blocks :copy/full-blocks] blocks))

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

(defn set-editor-args!
  [args]
  (set-state! :editor/args args))

(defn block-component-editing?
  []
  (:block/component-editing-mode? @state))

(defn set-block-component-editing-mode!
  [value]
  (set-state! :block/component-editing-mode? value))

(defn logical-outdenting?
  []
  (:editor/logical-outdenting?
    (get (sub-config) (get-current-repo))))

(defn get-editor-args
  []
  (:editor/args @state))

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

(defn set-page-blocks-cp!
  [value]
  (set-state! [:view/components :page-blocks] value))

(defn get-page-blocks-cp
  []
  (get-in @state [:view/components :page-blocks]))

(defn exit-editing-and-set-selected-blocks!
  ([blocks]
   (exit-editing-and-set-selected-blocks! blocks :down))
  ([blocks direction]
   (clear-edit!)
   (set-selection-blocks! blocks direction)))

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

(defn set-visual-viewport-state
  [input]
  (set-state! :ui/visual-viewport-state input))

(defn get-visual-viewport-state
  []
  (:ui/visual-viewport-state @state))

(defn get-plugin-by-id
  [id]
  (when-let [id (and id (keyword id))]
    (get-in @state [:plugin/installed-plugins id])))

(defn get-enabled?-installed-plugins
  ([theme?] (get-enabled?-installed-plugins theme? true false))
  ([theme? enabled? include-unpacked?]
   (filterv
     #(and (if include-unpacked? true (:iir %))
           (if-not (boolean? enabled?) true (= (not enabled?) (boolean (get-in % [:settings :disabled]))))
           (= (boolean theme?) (:theme %)))
     (vals (:plugin/installed-plugins @state)))))

(defn lsp-enabled?-or-theme
  []
  (:plugin/enabled @state))

(def lsp-enabled?
  (lsp-enabled?-or-theme))

(defn consume-updates-coming-plugin
  [payload updated?]
  (when-let [id (keyword (:id payload))]
    (let [pending? (boolean (seq (:plugin/updates-pending @state)))]
      (swap! state update :plugin/updates-pending dissoc id)
      (if updated?
        (if-let [error (:error-code payload)]
          (swap! state update-in [:plugin/updates-coming id] assoc :error-code error)
          (swap! state update :plugin/updates-coming dissoc id))
        (swap! state update :plugin/updates-coming assoc id payload))
      (pub-event! [:plugin/consume-updates id pending? updated?]))))

(defn coming-update-new-version?
  [pkg]
  (and pkg (:latest-version pkg)))

(defn plugin-update-available?
  [id]
  (when-let [pkg (and id (get (:plugin/updates-coming @state) (keyword id)))]
    (coming-update-new-version? pkg)))

(defn all-available-coming-updates
  []
  (when-let [updates (vals (:plugin/updates-coming @state))]
    (filterv #(coming-update-new-version? %) updates)))

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

(defn edit-in-query-component
  []
  (and (editing?)
       ;; config
       (:custom-query? (last (get-editor-args)))))

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
  (:auth/id-token @state))

(defn get-auth-refresh-token []
  (:auth/refresh-token @state))

(defn set-file-sync-manager [v]
  (set-state! :file-sync/sync-manager v))
(defn set-file-sync-state [v]
  (when v (s/assert :frontend.fs.sync/sync-state v))
  (set-state! :file-sync/sync-state v))

(defn get-file-sync-manager []
  (:file-sync/sync-manager @state))
(defn get-file-sync-state []
  (:file-sync/sync-state @state))

(defn reset-parsing-state!
  []
  (set-state! [:graph/parsing-state (get-current-repo)] {}))

(defn set-parsing-state!
  [m]
  (update-state! [:graph/parsing-state (get-current-repo)]
                 (if (fn? m) m
                   (fn [old-value] (merge old-value m)))))
