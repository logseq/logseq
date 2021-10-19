(ns frontend.state
  (:require [cljs-bean.core :as bean]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs.core.async :as async]
            [clojure.string :as string]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce ^:private state
  (let [document-mode? (or (storage/get :document/mode?) false)
        current-graph (let [graph (storage/get :git/current-repo)]
                        (when graph (ipc/ipc "setCurrentGraph" graph))
                        graph)]
    (atom
     {:route-match nil
      :today nil
      :system/events (async/chan 100)
      :db/batch-txs (async/chan 100)
      :file/writes (async/chan 100)
      :notification/show? false
      :notification/content nil
      :repo/cloning? false
      :repo/loading-files? nil
      :repo/importing-to-db? nil
      :repo/sync-status {}
      :repo/changed-files nil
      :nfs/user-granted? {}
      :nfs/refreshing? nil
      :instrument/disabled? (storage/get "instrument-disabled")
      ;; TODO: how to detect the network reliably?
      :network/online? true
      :indexeddb/support? true
      :me nil
      :git/current-repo current-graph
      :git/status {}
      :format/loading {}
      :draw? false
      :db/restoring? nil

      :journals-length 2

      :search/q ""
      :search/mode :global
      :search/result nil
      :search/graph-filters []

      ;; modals
      :modal/show? false

      ;; right sidebar
      :ui/fullscreen? false
      :ui/settings-open? false
      :ui/sidebar-open? false
      :ui/left-sidebar-open? (boolean (storage/get "ls-left-sidebar-open?"))
      :ui/theme (or (storage/get :ui/theme) "dark")
      :ui/system-theme? ((fnil identity (or util/mac? util/win32? false)) (storage/get :ui/system-theme?))
      :ui/wide-mode? false
      ;; :show-all, :hide-block-body, :hide-block-children
      :ui/cycle-collapse :show-all
      :ui/sidebar-collapsed-blocks {}
      :ui/root-component nil
      :ui/file-component nil
      :ui/custom-query-components {}
      :ui/show-recent? false
      :ui/command-palette-open? false
      :ui/developer-mode? (or (= (storage/get "developer-mode") "true")
                              false)
      ;; remember scroll positions of visited paths
      :ui/paths-scroll-positions {}

      :document/mode? document-mode?

      :github/contents {}
      :config {}
      :block/component-editing-mode? false
      :editor/draw-mode? false
      :editor/show-page-search? false
      :editor/show-page-search-hashtag? false
      :editor/show-date-picker? false
      ;; With label or other data
      :editor/show-input nil
      :editor/show-zotero false
      :editor/last-saved-cursor nil
      :editor/editing? nil
      :editor/last-edit-block-input-id nil
      :editor/last-edit-block-id nil
      :editor/in-composition? false
      :editor/content {}
      :editor/block nil
      :editor/block-dom-id nil
      :editor/set-timestamp-block nil
      :editor/last-input-time nil
      :editor/document-mode? document-mode?
      :editor/args nil
      :editor/on-paste? false

      :db/last-transact-time {}
      :db/last-persist-transact-ids {}
      ;; whether database is persisted
      :db/persisted? {}
      :db/latest-txs (or (storage/get-transit :db/latest-txs) {})
      :cursor-range nil

      :selection/mode false
      :selection/blocks []
      :selection/start-block nil
      ;; either :up or :down, defaults to down
      ;; used to determine selection direction when two or more blocks are selected
      :selection/direction :down
      :custom-context-menu/show? false
      :custom-context-menu/links nil

      ;; pages or blocks in the right sidebar
      ;; It is a list of `[repo db-id block-type block-data]` 4-tuple
      :sidebar/blocks '()

      :preferred-language (storage/get :preferred-language)

      ;; electron
      :electron/auto-updater-downloaded false
      :electron/updater-pending? false
      :electron/updater {}
      :electron/user-cfgs nil

      ;; plugin
      :plugin/indicator-text        nil
      :plugin/installed-plugins     {}
      :plugin/installed-themes      []
      :plugin/installed-commands    {}
      :plugin/installed-ui-items    {}
      :plugin/simple-commands       {}
      :plugin/selected-theme        nil
      :plugin/selected-unpacked-pkg nil
      :plugin/marketplace-pkgs      nil
      :plugin/marketplace-stats     nil
      :plugin/installing            nil
      :plugin/active-readme         nil

      ;; pdf
      :pdf/current                  nil
      :pdf/ref-highlight            nil

      ;; all notification contents as k-v pairs
      :notification/contents {}
      :graph/syncing? false

      ;; copied blocks
      :copy/blocks {:copy/content nil :copy/block-tree nil}

      :copy/export-block-text-indent-style  (or (storage/get :copy/export-block-text-indent-style)
                                                "dashes")
      :copy/export-block-text-remove-options (or (storage/get :copy/export-block-text-remove-options)
                                                 #{})
      :date-picker/date nil

      :youtube/players {}

      ;; command palette
      :command-palette/commands []

      :view/components {}

      :debug/write-acks {}

      :encryption/graph-parsing? false

      :favorites/dragging nil

      :srs/mode? false

      :srs/cards-due-count nil})))


(defn sub
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

(defn sub-current-route
  []
  (get-in (sub :route-match) [:data :name]))

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
  (or (:git/current-repo @state) "local"))

(defn get-config
  ([]
   (get-config (get-current-repo)))
  ([repo-url]
   (get-in @state [:config repo-url])))

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

(defn enable-encryption?
  [repo]
  (:feature/enable-encryption?
   (get (sub-config) repo)))

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

(defn hide-file?
  []
  (:hide-file-in-page? (get-config)))

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
  (when repo
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

(defn next-collapse-mode
  []
  (case (:ui/cycle-collapse @state)
    :show-all
    :hide-block-body

    :hide-block-body
    :hide-block-children

    :hide-block-children
    :show-all))

(defn cycle-collapse!
  []
  (set-state! :ui/cycle-collapse (next-collapse-mode)))

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
                                      (assoc m input-id value)))
     ;; followers
     ;; (when-let [s (util/extract-uuid input-id)]
     ;;   (let [input (gdom/getElement input-id)
     ;;         leader-parent (util/rec-get-block-node input)
     ;;         followers (->> (array-seq (js/document.getElementsByClassName s))
     ;;                        (remove #(= leader-parent %)))]
     ;;     (prn "followers: " (count followers))
     ;;     ))
     )))

(defn get-edit-input-id
  []
  (ffirst (:editor/editing? @state)))

(defn get-input
  []
  (when-let [id (get-edit-input-id)]
    (gdom/getElement id)))

(defn get-last-edit-input-id
  []
  (:editor/last-edit-block-input-id @state))

(defn editing?
  []
  (let [input (get-input)]
    (and input (= input (.-activeElement js/document)))))

(defn get-edit-content
  []
  (get (:editor/content @state) (get-edit-input-id)))

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

(defn set-cloning!
  [value]
  (set-state! :repo/cloning? value))

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

(defn get-editor-show-zotero
  []
  (get @state :editor/show-zotero))


(defn set-edit-input-id!
  [input-id]
  (swap! state update :editor/editing?
         (fn [m]
           (and input-id {input-id true}))))

(defn get-edit-pos
  []
  (when-let [input (get-input)]
    (.-selectionStart input)))

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
     (swap! state assoc
            :selection/mode true
            :selection/blocks blocks
            :selection/direction direction))))

(defn into-selection-mode!
  []
  (swap! state assoc :selection/mode true))

(defn clear-selection!
  []
  (swap! state assoc
         :selection/mode false
         :selection/blocks nil
         :selection/direction :down))

(defn clear-selection-blocks!
  []
  (swap! state assoc :selection/blocks nil))

(defn get-selection-blocks
  []
  (util/sort-by-height (:selection/blocks @state)))

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
         :selection/blocks (conj (vec (:selection/blocks @state)) block)
         :selection/direction direction))

(defn drop-last-selection-block!
  []
  (def blocks (:selection/blocks @state))
  (let [last-block (peek (vec (:selection/blocks @state)))]
    (swap! state assoc
           :selection/mode true
           :selection/blocks (vec (pop (:selection/blocks @state))))
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

(defn set-github-token!
  [repo token-result]
  (when token-result
    (let [{:keys [token expires_at]} token-result]
      (swap! state update-in [:me :repos]
             (fn [repos]
               (map (fn [r]
                      (if (= repo (:url r))
                        (merge r {:token token :expires_at expires_at})
                        repo)) repos))))))

(defn set-github-installation-tokens!
  [tokens]
  (when (seq tokens)
    (let [tokens  (medley/index-by :installation_id tokens)
          repos (get-repos)]
      (when (seq repos)
        (let [set-token-f
              (fn [{:keys [installation_id] :as repo}]
                (let [{:keys [token] :as m} (get tokens installation_id)]
                  (if (string? token)
                    ;; GitHub API returns a expires_at key which is a timestamp (expires after 60 minutes at present),
                    ;; however, user's system time may be inaccurate. Here, based on the client system time, we use
                    ;; 40-minutes interval to deal with some critical conditions, for e.g. http request time consume.
                    (let [formatter (tf/formatters :date-time-no-ms)
                          expires-at (->> (t/plus (t/now) (t/minutes 40))
                                          (tf/unparse formatter))]
                      (merge repo {:token token :expires_at expires-at}))
                    (do
                      (when (and
                             (:url repo)
                             (string/starts-with? (:url repo) "https://"))
                        (log/error :token/cannot-set-token {:repo-m repo :token-m m}))
                      repo))))
              repos (mapv set-token-f repos)]
          (swap! state assoc-in [:me :repos] repos))))))

(defn get-github-token
  [repo]
  (when repo
    (let [repos (get-repos)]
      (some #(when (= repo (:url %)) %) repos))))

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
  (when db-id
    (update-state! :sidebar/blocks (fn [blocks]
                                     (->> (remove #(= (second %) db-id) blocks)
                                          (cons [repo db-id block-type block-data])
                                          (distinct))))
    (open-right-sidebar!)
    (when-let [elem (gdom/getElementByClass "cp__right-sidebar-scrollable")]
      (util/scroll-to elem 0))))

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

(defn get-sidebar-blocks
  []
  (:sidebar/blocks @state))

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

(defn get-last-edit-block
  []
  (:editor/last-edit-block @state))

(defn get-current-edit-block-and-position
  []
  (let [edit-input-id (get-edit-input-id)
        edit-block (get-edit-block)
        block-element (when edit-input-id (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block")))
        container (when block-element
                    (util/get-block-container block-element))]
    (when container
      {:last-edit-block edit-block
       :container (gobj/get container "id")
       :pos (cursor/pos (gdom/getElement edit-input-id))})))

(defonce publishing? (atom nil))

(defn publishing-enable-editing?
  []
  (and @publishing? (:publishing/enable-editing? (get-config))))

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
                     :editor/last-edit-block-input-id edit-input-id
                     :editor/last-edit-block block
                     :cursor-range cursor-range))))

       (when-let [input (gdom/getElement edit-input-id)]
         (let [pos (count cursor-range)]
           (when content
             (util/set-change-value input content)
             ;; FIXME
             ;; use set-change-value for now
             ;; until somebody can figure out why set! value doesn't work here
             ;; it seems to me textarea autoresize is completely broken
             #_(set! (.-value input) (string/trim content)))
           (when move-cursor?
             (cursor/move-cursor-to input pos))))))))

(defn clear-edit!
  []
  (swap! state merge {:editor/editing? nil
                      :editor/block nil
                      :cursor-range nil}))

(defn set-last-pos!
  [new-pos]
  (set-state! :editor/last-saved-cursor new-pos))

(defn set-block-content-and-last-pos!
  [edit-input-id content new-pos]
  (when edit-input-id
    (set-edit-content! edit-input-id content)
    (set-state! :editor/last-saved-cursor new-pos)))

(defn set-theme!
  [theme]
  (set-state! :ui/theme theme)
  (storage/set :ui/theme theme))

(defn sync-system-theme!
  []
  (let [system-dark? (.-matches (js/window.matchMedia "(prefers-color-scheme: dark)"))]
    (set-theme! (if system-dark? "dark" "white"))
    (set-state! :ui/system-theme? true)
    (storage/set :ui/system-theme? true)))

(defn use-theme-mode!
  [theme-mode]
  (if-not (= theme-mode "system")
    (do
      (set-theme! (if (= theme-mode "light") "white" theme-mode))
      (set-state! :ui/system-theme? false)
      (storage/set :ui/system-theme? false))
    (sync-system-theme!)))

(defn dark?
  []
  (= "dark" (:ui/theme @state)))

(defn set-editing-block-dom-id!
  [block-dom-id]
  (set-state! :editor/block-dom-id block-dom-id))

(defn get-editing-block-dom-id
  []
  (:editor/block-dom-id @state))

(defn toggle-theme!
  []
  (let [theme (:ui/theme @state)
        theme' (if (= theme "dark") "white" "dark")]
    (use-theme-mode! theme')))

(defn- file-content-key
  [repo path]
  (str "ls_file_content_" repo path))

(defn update-sync-status!
  [status]
  (when (seq status)
    (when-let [current-repo (get-current-repo)]
      (set-state! [:repo/sync-status current-repo] status))))

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

(defn set-git-status!
  [repo-url value]
  (swap! state assoc-in [:git/status repo-url] value))

(defn shortcuts []
  (get-in @state [:config (get-current-repo) :shortcuts]))

(defn get-me
  []
  (:me @state))

(defn github-authed?
  []
  (:github-authed? (get-me)))

(defn get-name
  []
  (:name (get-me)))

(defn logged?
  "Whether the user has logged in."
  []
  (some? (get-name)))

(defn set-draw!
  [value]
  (set-state! :draw? value))

(defn in-draw-mode?
  []
  (:draw? @state))

(defn set-db-restoring!
  [value]
  (set-state! :db/restoring? value))

(defn get-default-branch
  [repo-url]
  (or
   (some->> (get-repos)
            (filter (fn [m]
                      (= (:url m) repo-url)))
            (first)
            :branch)
   "master"))

(defn get-current-project
  []
  (when-let [project (get-in (get-config) [:project :name])]
    (when-not (string/blank? project)
      project)))

(defn update-current-project
  [& kv]
  {:pre [(even? (count kv))]}
  (when-let [current-repo (get-current-repo)]
    (let [new-kvs (apply array-map (vec kv))
          projects (:projects (get-me))
          new-projects (reduce (fn [acc project]
                                 (if (= (:repo project) current-repo)
                                   (conj acc (merge project new-kvs))
                                   (conj acc project)))
                               []
                               projects)]
      (set-state! [:me :projects] new-projects))))

(defn remove-current-project
  []
  (when-let [current-repo (get-current-repo)]
    (update-state! [:me :projects]
                   (fn [projects]
                     (remove #(= (:repo %) current-repo) projects)))))

(defn set-indexedb-support!
  [value]
  (set-state! :indexeddb/support? value))

(defn modal-opened?
  []
  (:modal/show? @state))

(defn set-modal!
  ([modal-panel-content]
   (set-modal! modal-panel-content
               {:fullscreen? false
                :close-btn?  true}))
  ([modal-panel-content {:keys [fullscreen? close-btn?]}]
   (swap! state assoc
          :modal/show? (boolean modal-panel-content)
          :modal/panel-content modal-panel-content
          :modal/fullscreen? fullscreen?
          :modal/close-btn? close-btn?)))

(defn close-modal!
  []
  (swap! state assoc
         :modal/show? false
         :modal/panel-content nil))

(defn get-db-batch-txs-chan
  []
  (:db/batch-txs @state))

(defn get-file-write-chan
  []
  (:file/writes @state))

(defn get-write-chan-length
  []
  (let [c (get-file-write-chan)]
    (count (gobj/get c "buf"))))

(defn add-tx!
  ;; TODO: replace f with data for batch transactions
  [f]
  (when f
    (when-let [chan (get-db-batch-txs-chan)]
      (async/put! chan f))))

(defn get-left-sidebar-open?
  []
  (get-in @state [:ui/left-sidebar-open?]))

(defn set-left-sidebar-open!
  [value]
  (storage/set "ls-left-sidebar-open?" (boolean value))
  (set-state! :ui/left-sidebar-open? value))

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

(defn enable-tooltip?
  []
  (if (util/mobile?)
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

(defn get-git-auto-push?
  ([]
   (get-git-auto-push? (get-current-repo)))
  ([repo]
   (true? (:git-auto-push (get-config repo)))))

(defn set-changed-files!
  [repo changed-files]
  (set-state! [:repo/changed-files repo] changed-files))

(defn get-changed-files
  []
  (get-in @state [:repo/changed-files (get-current-repo)]))

(defn get-wide-mode?
  []
  (:ui/wide-mode? @state))

(defn toggle-wide-mode!
  []
  (update-state! :ui/wide-mode? not))

(defn set-online!
  [value]
  (set-state! :network/online? value))

(defn online?
  []
  (:network/online? @state))

(defn get-commands
  []
  (:commands (get-config)))

(defn get-plugins-commands
  []
  (mapcat seq (flatten (vals (:plugin/installed-commands @state)))))

(defn get-plugins-commands-with-type
  [type]
  (filterv #(= (keyword (first %)) (keyword type))
           (apply concat (vals (:plugin/simple-commands @state)))))

(defn get-plugins-ui-items-with-type
  [type]
  (filterv #(= (keyword (first %)) (keyword type))
           (apply concat (vals (:plugin/installed-ui-items @state)))))

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
  [value]
  (set-state! :repo/loading-files? value))

(defn set-importing-to-db!
  [value]
  (set-state! :repo/importing-to-db? value))

(defn set-editor-last-input-time!
  [repo time]
  (swap! state assoc-in [:editor/last-input-time repo] time))

(defn set-last-transact-time!
  [repo time]
  (swap! state assoc-in [:db/last-transact-time repo] time)

  ;; THINK: new block, indent/outdent, drag && drop, etc.
  (set-editor-last-input-time! repo time))

(defn set-published-pages
  [pages]
  (when-let [repo (get-current-repo)]
    (set-state! [:me :published-pages repo] pages)))

(defn reset-published-pages
  []
  (set-published-pages []))

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

(defn set-last-persist-transact-id!
  [repo files? id]
  (swap! state assoc-in [:db/last-persist-transact-ids :repo files?] id))

(defn get-last-persist-transact-id
  [repo files?]
  (get-in @state [:db/last-persist-transact-ids :repo files?]))

(defn persist-transaction!
  [repo files? tx-id tx-data]
  (when (seq tx-data)
    (let [latest-txs (:db/latest-txs @state)
          last-persist-tx-id (get-last-persist-transact-id repo files?)
          latest-txs (if last-persist-tx-id
                       (update-in latest-txs [repo files?]
                                  (fn [result]
                                    (remove (fn [tx] (<= (:tx-id tx) last-persist-tx-id)) result)))
                       latest-txs)
          new-txs (update-in latest-txs [repo files?] (fn [result]
                                                        (vec (conj result {:tx-id   tx-id
                                                                           :tx-data tx-data}))))]
      (storage/set-transit! :db/latest-txs new-txs)
      (set-state! :db/latest-txs new-txs))))

(defn get-repo-latest-txs
  [repo file?]
  (get-in (:db/latest-txs @state) [repo file?]))

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

(defonce diffs (atom nil))

(defn get-copied-blocks
  []
  (:copy/blocks @state))

(defn set-copied-blocks
  [content ids]
  (set-state! :copy/blocks {:copy/content content :copy/block-tree ids}))

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

(defn set-editor-cp!
  [value]
  (set-state! [:view/components :editor] value))

(defn get-editor-cp
  []
  (get-in @state [:view/components :editor]))

(defn exit-editing-and-set-selected-blocks!
  ([blocks]
   (exit-editing-and-set-selected-blocks! blocks :down))
  ([blocks direction]
   (util/select-unhighlight! (dom/by-class "selected"))
   (clear-selection!)
   (clear-edit!)
   (set-selection-blocks! blocks direction)
   (util/select-highlight! blocks)))

(defn get-favorites-name
  []
  (or (:name/favorites (get-config)) "Favorites"))

(defn add-watch-state [key f]
  (add-watch state key f))

(defn remove-watch-state [key]
  (remove-watch state key))

(defn get-git-auto-commit-enabled?
  []
  (false? (sub [:electron/user-cfgs :git/disable-auto-commit?])))
