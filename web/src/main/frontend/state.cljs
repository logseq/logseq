(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]
            [frontend.util :as util]
            [clojure.string :as string]
            [medley.core :as medley]
            [goog.object :as gobj]
            [goog.dom :as gdom]))

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
    :me nil
    :git/clone-repo (or (storage/get :git/clone-repo) "")
    :git/current-repo (storage/get :git/current-repo)
    :git/status {}
    :format/loading {}

    :journals-length 1

    :search/q ""
    :search/result nil

    :ui/theme (or (storage/get :ui/theme) "white")
    :ui/toggle-state false
    :ui/collapsed-headings {}
    :ui/sidebar-collapsed-blocks {}
    :ui/root-component nil
    :ui/custom-query-components {}

    :github/contents {}
    :config {}
    :editor/show-page-search? false
    :editor/show-date-picker? false
    ;; With label or other data
    :editor/show-input nil
    :editor/last-saved-cursor nil
    :editor/editing? nil
    :editor/content {}
    :editor/heading nil
    :cursor-range nil
    :cursor-pos nil

    :selection/mode false
    :selection/headings nil
    :custom-context-menu/show? false

    ;; encrypted github token
    :encrypt/token (storage/get :encrypt/token)

    ;; pages or headings in the right sidebar
    :sidebar/blocks '()
    }))

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

(defn get-preferred-format
  []
  (keyword
   (get-in @state [:me :preferred_format] "markdown")))

(defn get-repos
  []
  (get-in @state [:me :repos]))

(defn set-current-repo!
  [repo]
  (swap! state assoc :git/current-repo repo)
  (storage/set :git/current-repo repo))

(defn set-preferred-format!
  [format]
  (swap! state assoc-in [:me :preferred_format] (name format)))

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

(defn ui-toggle-state!
  []
  (update-state! :ui/toggle-state not))

(defn get-edit-heading
  []
  (:edit-heading @state))

(defn set-edit-content!
  [input-id value set-input-value?]
  (when input-id
    (when set-input-value?
      (when-let [input (gdom/getElement input-id)]
        (gobj/set input "value" value)))
    (update-state! :editor/content (fn [m]
                                     (assoc m input-id value)))))

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

(defn collapse-heading!
  [heading-id]
  (set-state! [:ui/collapsed-headings heading-id] true))

(defn expand-heading!
  [heading-id]
  (set-state! [:ui/collapsed-headings heading-id] false))

(defn clear-collapsed-headings!
  []
  (set-state! :ui/collapsed-headings {}))

(defn set-q!
  [value]
  (set-state! :search/q value))

(defn set-config!
  [repo-url value]
  (set-state! [:config repo-url] value))

(defn star-page!
  [repo-url page starred?]
  (update-state! [:config repo-url :starred]
                 (fn [pages]
                   (if starred?
                     (vec
                      (remove
                       #(= (string/lower-case page) (string/lower-case %))
                       pages))
                     (vec (distinct (conj pages page)))))))

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

(defn get-edit-input-id
  []
  (ffirst (:editor/editing? @state)))

(defn sub-edit-input-id
  []
  (ffirst (util/react (rum/cursor state :editor/editing?))))

(defn set-selection-headings!
  [headings]
  (when (seq headings)
    (swap! state assoc
           :selection/mode true
           :selection/headings headings)))

(defn clear-selection!
  []
  (swap! state assoc
         :selection/mode false
         :selection/headings nil))

(defn get-selection-headings
  []
  (:selection/headings @state))

(defn in-selection-mode?
  []
  (:selection/mode @state))

(defn show-custom-context-menu!
  []
  (swap! state assoc :custom-context-menu/show? true))

(defn hide-custom-context-menu!
  []
  (swap! state assoc :custom-context-menu/show? false))

(defn set-git-clone-repo!
  [repo]
  (set-state! :git/clone-repo repo)
  (storage/set :git/clone-repo repo))

(defn logged?
  []
  (get-in @state [:me :name]))

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

(defn sidebar-add-block!
  [repo db-id block-type block-data]
  (when db-id
    (update-state! :sidebar/blocks (fn [blocks]
                                     (->> (remove #(= (first %) db-id) blocks)
                                          (cons [repo db-id block-type block-data])
                                          (distinct))))))
(defn sidebar-remove-block!
  [idx]
  (update-state! :sidebar/blocks #(util/drop-nth idx %)))
(defn sidebar-clear!
  []
  (set-state! :sidebar/blocks '()))
(defn get-sidebar-blocks
  []
  (:sidebar/blocks @state))

(defn sidebar-block-toggle-collapse!
  [db-id]
  (when db-id
    (update-state! [:ui/sidebar-collapsed-blocks db-id] not)))

(defn set-edit-heading!
  [heading]
  (set-state! :edit-heading heading))

(defn set-editing!
  [edit-input-id content heading]
  (when edit-input-id
    (reset! state
            (-> @state
                (assoc-in [:editor/content edit-input-id] content)
                (assoc :edit-heading heading
                       :editor/editing? {edit-input-id true})))))

(defn set-heading-content-and-last-pos!
  [edit-input-id content new-pos]
  (when edit-input-id
    (set-edit-content! edit-input-id content true)
    (reset! state (assoc @state :editor/last-saved-cursor new-pos))))

(defn set-theme!
  [theme]
  (set-state! :ui/theme theme)
  (storage/set :ui/theme theme))

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
