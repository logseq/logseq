(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [medley.core :as medley]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [dommy.core :as dom]
            [cljs.core.async :as async]
            [lambdaisland.glogi :as log]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]))

(defonce ^:private state
  (atom
   {:route-match nil
    :today nil
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
    ;; TODO: how to detect the network reliably?
    :network/online? true
    :indexeddb/support? true
    :me nil
    :git/current-repo (storage/get :git/current-repo)
    :git/status {}
    :format/loading {}
    :draw? false
    :db/restoring? nil

    :journals-length 1

    :search/q ""
    :search/result nil

    ;; custom shortcuts
    :shortcuts {:editor/new-block "enter"}

    ;; modals
    :modal/show? false

    ;; right sidebar
    :ui/settings-open? false
    :ui/sidebar-open? false
    :ui/left-sidebar-open? false
    :ui/theme (or (storage/get :ui/theme) "dark")
    ;; :show-all, :hide-block-body, :hide-block-children
    :ui/cycle-collapse :show-all
    :ui/collapsed-blocks {}
    :ui/sidebar-collapsed-blocks {}
    :ui/root-component nil
    :ui/file-component nil
    :ui/custom-query-components {}
    :ui/show-recent? false
    :ui/developer-mode? (or (= (storage/get "developer-mode") "true")
                            false)
    :document/mode? (or (storage/get :document/mode?) false)

    :github/contents {}
    :config {}
    :editor/show-page-search? false
    :editor/show-page-search-hashtag? false
    :editor/show-date-picker? false
    ;; With label or other data
    :editor/show-input nil
    :editor/last-saved-cursor nil
    :editor/editing? nil
    :editor/last-edit-block-id nil
    :editor/in-composition? false
    :editor/pos 0
    :editor/content {}
    :editor/block nil
    :editor/block-dom-id nil
    :editor/set-timestamp-block nil
    :editor/last-input-time nil
    :db/last-transact-time {}
    :db/last-persist-transact-ids {}
    ;; whether database is persisted
    :db/persisted? {}
    :db/latest-txs (or (storage/get-transit :db/latest-txs) {})
    :cursor-range nil

    :selection/mode false
    :selection/blocks []
    :selection/start-block nil
    :custom-context-menu/show? false
    :custom-context-menu/links nil

    ;; pages or blocks in the right sidebar
    ;; It is a list of `[repo db-id block-type block-data]` 4-tuple
    :sidebar/blocks '()

    :preferred-language (storage/get :preferred-language)

    ;; electron
    :electron/updater-pending? false
    :electron/updater {}

    ;; all notification contents as k-v pairs
    :notification/contents {}
    :graph/syncing? false}))

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
  (and
   (= :page (get-current-route))
   (get-in (get-route-match)
           [:path-params :name])))

(defn route-has-p?
  []
  (get-in (get-route-match) [:query-params :p]))

(defn sub
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

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

(defn all-pages-public?
  []
  (true? (:all-pages-public? (get-config))))

(defn enable-grammarly?
  []
  (true? (:feature/enable-grammarly?
          (get (sub-config) (get-current-repo)))))

(defn enable-timetracking?
  []
  (not (false? (:feature/enable-timetracking?
                (get (sub-config) (get-current-repo))))))

(defn enable-journals?
  [repo]
  (not (false? (:feature/enable-journals?
                (get (sub-config) repo)))))

(defn enable-encryption?
  [repo]
  (:feature/enable-encryption?
   (get (sub-config) repo)))

(defn enable-git-auto-push?
  [repo]
  (not (false? (:git-auto-push
                (get (sub-config) repo)))))

(defn enable-block-time?
  []
  ;; (true? (:feature/enable-block-time?
  ;;         (get (sub-config) (get-current-repo))))

  ;; Disable block timestamps for now, because it doesn't work with undo/redo
  false)

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

(defn get-pages-directory
  []
  (or
   (when-let [repo (get-current-repo)]
     (:pages-directory (get-config repo)))
   "pages"))

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
        (if (re-find #"now|NOW" workflow)
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
    (storage/remove :git/current-repo)))

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

(defn get-last-edit-input-id
  []
  (:editor/last-edit-block-id @state))

(defn editing?
  []
  (some? (get-edit-input-id)))

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

                                        ; FIXME: unused function
(defn get-cloning?
  []
  (:repo/cloning? @state))

(defn set-cloning!
  [value]
  (set-state! :repo/cloning? value))

(defn get-block-collapsed-state
  [block-id]
  (get-in @state [:ui/collapsed-blocks block-id]))

(defn set-collapsed-state!
  [block-id value]
  (set-state! [:ui/collapsed-blocks block-id] value))

(defn collapse-block!
  [block-id]
  (set-collapsed-state! block-id true))

(defn expand-block!
  [block-id]
  (set-collapsed-state! block-id false))

(defn collapsed?
  [block-id]
  (get-in @state [:ui/collapsed-blocks block-id]))

(defn clear-collapsed-blocks!
  []
  (set-state! :ui/collapsed-blocks {}))

(defn set-q!
  [value]
  (set-state! :search/q value))

(defn set-editor-show-page-search!
  [value]
  (set-state! :editor/show-page-search? value)
  (set-state! :editor/show-page-search-hashtag? false))
(defn set-editor-show-page-search-hashtag!
  [value]
  (set-state! :editor/show-page-search? value)
  (set-state! :editor/show-page-search-hashtag? value))

(defn get-editor-show-page-search?
  []
  (get @state :editor/show-page-search?))
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

(defn set-edit-input-id!
  [input-id]
  (swap! state update :editor/editing?
         (fn [m]
           (and input-id {input-id true}))))

(defn set-edit-pos!
  [pos]
  (set-state! :editor/pos pos))

(defn get-edit-pos
  []
  (:editor/pos @state))

(defn set-selection-start-block!
  [start-block]
  (swap! state assoc :selection/start-block start-block))

(defn get-selection-start-block
  []
  (get @state :selection/start-block))

(defn set-selection-blocks!
  [blocks]
  (when (seq blocks)
    (swap! state assoc
           :selection/mode true
           :selection/blocks blocks)))

(defn into-selection-mode!
  []
  (swap! state assoc :selection/mode true))

(defn clear-selection!
  []
  (swap! state assoc
         :selection/mode false
         :selection/blocks nil
         :selection/up? nil))

(defn clear-selection-blocks!
  []
  (swap! state assoc :selection/blocks nil))

(defn get-selection-blocks
  []
  (:selection/blocks @state))

(defn in-selection-mode?
  []
  (:selection/mode @state))

(defn conj-selection-block!
  [block up?]
  (dom/add-class! block "selected noselect")
  (swap! state assoc
         :selection/mode true
         :selection/blocks (conj (:selection/blocks @state) block)
         :selection/up? up?))

(defn pop-selection-block!
  []
  (let [[first-block & others] (:selection/blocks @state)]
    (swap! state assoc
           :selection/mode true
           :selection/blocks others)
    first-block))

(defn selection-up?
  []
  (:selection/up? @state))

(defn set-selection-up!
  [value]
  (swap! state assoc :selection/up? value))

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
                    ;; Github API returns a expires_at key which is a timestamp (expires after 60 minutes at present),
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
                                        ; FIXME: No need to call `distinct`?
                                          (distinct))))
    (open-right-sidebar!)
    (when-let [elem (gdom/getElement "right-sidebar")]
      (util/scroll-to elem 0))))

(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks (fn [blocks]
                                   (if (= (str idx) "contents")
                                     (remove #(= (second %) "contents") blocks)
                                     (util/drop-nth idx blocks))))
  (when (empty? (:sidebar/blocks @state))
    (hide-right-sidebar!)))

(defn sidebar-block-exists?
  [idx]
  (some #(= (second %) idx) (:sidebar/blocks @state)))

(defn get-sidebar-blocks
  []
  (:sidebar/blocks @state))

(defn sidebar-block-toggle-collapse!
  [db-id]
  (when db-id
    (update-state! [:ui/sidebar-collapsed-blocks db-id] not)))

(defn set-editing!
  [edit-input-id content block cursor-range]
  (when edit-input-id
    (let [block-element (gdom/getElement (string/replace edit-input-id "edit-block" "ls-block"))
          {:keys [idx container]} (util/get-block-idx-inside-container block-element)
          block (if (and idx container)
                  (assoc block
                         :block/idx idx
                         :block/container (gobj/get container "id"))
                  block)
          content (or content "")]
      (swap! state
             (fn [state]
               (-> state
                   (assoc-in [:editor/content edit-input-id] (string/trim content))
                   (assoc
                    :editor/block block
                    :editor/editing? {edit-input-id true}
                    :editor/last-edit-block-id edit-input-id
                    :cursor-range cursor-range)))))))

(defn clear-edit!
  []
  (swap! state merge {:editor/editing? nil
                      :editor/block nil
                      :cursor-range nil}))

(defn get-edit-block
  []
  (get @state :editor/block))

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
    (set-theme! theme')))

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

(defn get-journal-template
  []
  (when-let [repo (get-current-repo)]
    (get-in @state [:config repo :default-templates :journals])))

(defn set-today!
  [value]
  (set-state! :today value))

(defn toggle-document-mode!
  []
  (let [mode (get @state :document/mode?)]
    (set-state! :document/mode? (not mode))
    (storage/set :document/mode? (not mode))))

(defn get-date-formatter
  []
  (or
   (when-let [repo (get-current-repo)]
     (get-in @state [:config repo :date-formatter]))
    ;; TODO:
   (get-in @state [:me :settings :date-formatter])
   "MMM do, yyyy"))

(defn set-git-status!
  [repo-url value]
  (swap! state assoc-in [:git/status repo-url] value))

(defn get-shortcut
  ([key]
   (get-shortcut (get-current-repo) key))
  ([repo key]
   (or
    (get (storage/get (str repo "-shortcuts")) key)
    (get-in @state [:config repo :shortcuts key]))))

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

(defn set-modal!
  [modal-panel-content]
  (swap! state assoc
         :modal/show? (boolean modal-panel-content)
         :modal/panel-content modal-panel-content))

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
  (set-state! :ui/left-sidebar-open? value))

(defn set-developer-mode!
  [value]
  (set-state! :ui/developer-mode? value)
  (storage/set "developer-mode" (str value)))

(defn get-notification-contents
  []
  (get @state :notification/contents))

(defn get-new-block-shortcut
  []
  (let [shortcut (get-in @state [:shortcuts :editor/new-block])]
    (if (and shortcut (contains? #{"enter" "alt+enter"} (string/lower-case shortcut)))
      shortcut
      "enter")))

(defn set-new-block-shortcut!
  [value]
  (set-state! [:shortcuts :editor/new-block] value))

(defn toggle-new-block-shortcut!
  []
  (if-let [enter? (= "enter" (get-new-block-shortcut))]
    (set-new-block-shortcut! "alt+enter")
    (set-new-block-shortcut! "enter")))

(defn set-config!
  [repo-url value]
  (let [old-shortcuts (get-in @state [:config repo-url :shortcuts])]
    (set-state! [:config repo-url] value)

    ;; TODO: refactor. This seems useless as the default value has already been handled in
    ;; `get-new-block-shortcut`.
    (set-new-block-shortcut!
     (or (get-shortcut repo-url :editor/new-block)
         "enter"))

    (let [shortcuts (or (:shortcuts value) {})]
      (storage/set (str repo-url "-shortcuts") shortcuts))))

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

(defn set-online!
  [value]
  (set-state! :network/online? value))

(defn online?
  []
  (:network/online? @state))

(defn get-commands
  []
  (:commands (get-config)))

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
         (>= (- now last-time) 1000)))
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

(defn toggle!
  [path]
  (update-state! path not))

(defn toggle-settings!
  []
  (toggle! :ui/settings-open?))

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

(defonce diffs (atom nil))
