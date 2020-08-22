(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [clojure.string :as string]
            [medley.core :as medley]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [dommy.core :as dom]))

(defonce state
  (atom
   {:route-match nil
    :today nil
    :notification/show? false
    :notification/content nil
    :repo/cloning? false
    :repo/loading-files? nil
    :repo/importing-to-db? nil
    :repo/sync-status {}
    :repo/changed-files (or
                         (storage/get "git-changed-files")
                         {})
    :indexeddb/support? true
    :me nil
    :git/clone-repo (or (storage/get :git/clone-repo) "")
    :git/current-repo (storage/get :git/current-repo)
    :git/status {}
    :format/loading {}
    :draw? false
    :db/restoring? nil

    :journals-length 1

    :search/q ""
    :search/result nil

    :ui/sidebar-open? false
    :ui/theme (or (storage/get :ui/theme) "dark")
    ;; :show-all, :hide-block-body, :hide-block-children
    :ui/cycle-collapse :show-all
    :ui/collapsed-blocks {}
    :ui/sidebar-collapsed-blocks {}
    :ui/root-component nil
    :ui/custom-query-components {}
    :ui/show-recent? false
    :document/mode? (or (storage/get :document/mode?) false)

    :github/contents {}
    :config {}
    :editor/show-page-search? false
    :editor/show-date-picker? false
    ;; With label or other data
    :editor/show-input nil
    :editor/last-saved-cursor nil
    :editor/editing? nil
    :editor/content {}
    :editor/block nil
    :cursor-range nil
    :cursor-pos nil

    :selection/mode false
    :selection/blocks []
    :selection/start-block nil
    :custom-context-menu/show? false
    :custom-context-menu/links nil

    ;; encrypted github token
    :encrypt/token (storage/get :encrypt/token)

    ;; pages or blocks in the right sidebar
    :sidebar/blocks '()
    }))

(defn get-route-match
  []
  (:route-match @state))

(defn get-current-route
  []
  (get-in (get-route-match) [:data :name]))

(defn get-current-page
  []
  (and
   (= :page (get-current-route))
   (get-in (get-route-match)
           [:path-params :name])))

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
  (:git/current-repo @state))

(defn get-config
  ([]
   (get-config (get-current-repo)))
  ([repo-url]
   (get-in @state [:config repo-url])))

(defn get-preferred-format
  []
  (keyword
   (or
    (when-let [fmt (:preferred-format (get-config))]
      (string/lower-case (name fmt)))

    (get-in @state [:me :preferred_format] "markdown"))))

(defn get-preferred-workflow
  []
  (keyword
   (or
    (when-let [workflow (:preferred-workflow (get-config))]
      (let [workflow (name workflow)]
        (if (or (re-find #"now" workflow)
                (re-find #"NOW" workflow))
          :now
          :todo)))
    (get-in @state [:me :preferred_workflow] :now))))

(defn get-preferred-todo
  []
  (if (= (get-preferred-workflow) :now)
    "LATER"
    "TODO"))

(defn get-repos
  []
  (get-in @state [:me :repos]))

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

(defn set-edit-content!
  [input-id value]
  (when input-id
    (when-let [input (gdom/getElement input-id)]
      (gobj/set input "value" value))
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
    ))

(defn get-edit-input-id
  []
  (ffirst (:editor/editing? @state)))

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

(defn set-cursor-pos!
  [value]
  (set-state! :cursor-pos value))

(defn cloning?
  []
  (:repo/cloning? @state))

(defn set-cloning?
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

(defn set-config!
  [repo-url value]
  (set-state! [:config repo-url] value))

(defn set-editor-show-page-search
  [value]
  (set-state! :editor/show-page-search? value))
(defn get-editor-show-page-search
  []
  (get @state :editor/show-page-search?))
(defn set-editor-show-block-search
  [value]
  (set-state! :editor/show-block-search? value))
(defn get-editor-show-block-search
  []
  (get @state :editor/show-block-search?))
(defn set-editor-show-date-picker
  [value]
  (set-state! :editor/show-date-picker? value))
(defn get-editor-show-date-picker
  []
  (get @state :editor/show-date-picker?))
(defn set-editor-show-input
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

(defn set-selection-start-block!
  [start-block]
  (swap! state assoc :selection/start-block start-block))

(defn get-selection-start-block
  []
  (get @state :selection/start-block))

(defn clear-selection-region!
  []
  (swap! state assoc
         :selection/start-block nil
         :selection/end-block nil))

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

(defn set-selection-up?
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

(defn set-git-clone-repo!
  [repo]
  (set-state! :git/clone-repo repo)
  (storage/set :git/clone-repo repo))

(defn set-github-token!
  [token]
  (swap! state assoc-in [:me :access-token] token))

(defn get-encrypted-token
  []
  (:encrypt/token @state))

(defn set-encrypt-token!
  [encrypted]
  (when encrypted
    (set-state! :encrypt/token encrypted)
    (storage/set :encrypt/token encrypted)))

(defn clear-encrypt-token!
  []
  (set-state! :encrypt/token nil)
  (storage/remove :encrypt/token))


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
                                     (->> (remove #(= (first %) db-id) blocks)
                                          (cons [repo db-id block-type block-data])
                                          (distinct))))
    (open-right-sidebar!)))

(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks #(util/drop-nth idx %))
  (when (empty? (:sidebar/blocks @state))
    (hide-right-sidebar!)))

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
    (let [content (or content "")]
      (swap! state
             (fn [state]
               (-> state
                   (assoc-in [:editor/content edit-input-id] (string/trim content))
                   (assoc
                    :editor/block block
                    :editor/editing? {edit-input-id true}
                    :cursor-range cursor-range)))))))

(defn clear-edit!
  []
  (swap! state merge {:editor/editing? nil
                      :editor/block nil
                      :cursor-range nil}))

(defn get-edit-block
  []
  (get @state :editor/block))

(defn set-block-content-and-last-pos!
  [edit-input-id content new-pos]
  (when edit-input-id
    (set-edit-content! edit-input-id content)
    (reset! state (assoc @state :editor/last-saved-cursor new-pos))))

(defn set-theme!
  [theme]
  (set-state! :ui/theme theme)
  (storage/set :ui/theme theme))

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
  [repo key]
  (get-in @state [:config repo :shortcuts key]))

(defn get-me
  []
  (:me @state))

(defn logged?
  []
  (some? (:name (get-me))))

(defn set-draw!
  [value]
  (set-state! :draw? value))

(defn in-draw-mode?
  []
  (:draw? @state))

(defn set-db-restoring!
  [value]
  (set-state! :db/restoring? value))

(defn get-current-project
  []
  (when-let [repo (get-current-repo)]
    (let [projects (:projects (get-me))
          project (:name (first (filter (fn [p] (= (:repo p) repo)) projects)))]
      (when-not (string/blank? project)
        project))))

(defn set-indexedb-support?
  [value]
  (set-state! :indexeddb/support? value))

(defn git-add!
  [repo file]
  (update-state! [:repo/changed-files repo]
                 (fn [files] (distinct (conj files file))))
  (storage/set "git-changed-files" (:repo/changed-files @state)))

(defn clear-changed-files!
  [repo]
  (set-state! [:repo/changed-files repo] nil)
  (set-state! [:git/status repo] nil)
  (storage/set "git-changed-files" (:repo/changed-files @state)))

(defn get-changed-files
  [repo]
  (get-in @state [:repo/changed-files repo]))

(defn get-github-token
  []
  (get-in @state [:me :access-token]))

(defn set-modal!
  [modal-panel-content]
  (swap! state assoc
         :modal/show? true
         :modal/panel-content modal-panel-content))

(defn close-modal!
  []
  (swap! state assoc
         :modal/show? false
         :modal/panel-content nil))
