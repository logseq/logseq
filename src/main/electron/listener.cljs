(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.handler.route :as route-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.config :as config]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.fs.sync :as sync]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.ui :as ui]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user]
            [dommy.core :as dom]))

(defn persist-dbs!
  []
  ;; only persist current db!
  ;; TODO rename the function and event to persist-db
  (repo-handler/persist-db! {:before     #(notification/show!
                                           (ui/loading (t :graph/persist))
                                           :warning)
                             :on-success #(ipc/ipc "persistent-dbs-saved")
                             :on-error   #(ipc/ipc "persistent-dbs-error")}))

(defn listen-persistent-dbs!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on
   "persistent-dbs"
   (fn [_req]
     (persist-dbs!))))

(defn ^:large-vars/cleanup-todo listen-to-electron!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (watcher-handler/handle-changed! type payload)
                         (when (file-sync-handler/enable-sync?)
                           (sync/file-watch-handler type payload)))))

  (js/window.apis.on "notification"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)
                             type (keyword type)
                             comp [:div (str payload)]]
                         (notification/show! comp type false))))

  (js/window.apis.on "graphUnlinked"
                     (fn [data]
                       (let [repo (bean/->clj data)]
                         (repo-handler/remove-repo! repo))))

  (js/window.apis.on "setGitUsernameAndEmail"
                     (fn []
                       (state/pub-event! [:modal/set-git-username-and-email])))

  (js/window.apis.on "getCurrentGraph"
                     (fn []
                       (when-let [graph (state/get-current-repo)]
                         (ipc/ipc "setCurrentGraph" graph))))

  (js/window.apis.on "redirect"
                     (fn [data]
                       (let [{:keys [payload]} (bean/->clj data)
                             payload (update payload :to keyword)]
                         (route-handler/redirect! payload))))

  (js/window.apis.on "redirectWhenExists"
                     ;;  Redirect to the given page or block when the provided page or block exists.
                     ;;  Either :page-name or :block-id is required.
                     ;;  :page-name : the original-name of the page.
                     ;;  :block-id : uuid.
                     (fn [data]
                       (let [{:keys [page-name block-id file]} (bean/->clj data)]
                         (cond
                           page-name
                           (let [db-page-name (db-model/get-redirect-page-name page-name)]
                             ;; No error handling required, as a page name is always valid
                             ;; Open new page if the page does not exist
                             (editor-handler/insert-first-page-block-if-not-exists! db-page-name))

                           block-id
                           (if (db-model/get-block-by-uuid block-id)
                             (route-handler/redirect-to-page! block-id)
                             (notification/show! (str "Open link failed. Block-id `" block-id "` doesn't exist in the graph.") :error false))

                           file
                           (if-let [db-page-name (db-model/get-file-page file false)]
                             (route-handler/redirect-to-page! db-page-name)
                             (notification/show! (str "Open link failed. File `" file "` doesn't exist in the graph.") :error false))))))

  (js/window.apis.on "dbsync"
                     (fn [data]
                       (let [{:keys [graph tx-data]} (bean/->clj data)
                             tx-data (db/string->db (:data tx-data))]
                         (when-let [conn (db/get-db graph false)]
                           (d/transact! conn tx-data {:dbsync? true}))
                         (ui-handler/re-render-root!))))

  (js/window.apis.on "persistGraph"
                     ;; electron is requesting window for persisting a graph in it's db
                     ;; fire back "broadcastPersistGraphDone" on done
                     (fn [data]
                       (let [repo (bean/->clj data)
                             before-f #(notification/show!
                                        (ui/loading (t :graph/persist))
                                        :warning)
                             after-f #(ipc/ipc "broadcastPersistGraphDone")
                             error-f (fn []
                                       (after-f)
                                       (notification/show!
                                        (t :graph/persist-error)
                                        :error))
                             handlers {:before     before-f
                                       :on-success after-f
                                       :on-error   error-f}]
                         (repo-handler/persist-db! repo handlers))))

  (js/window.apis.on "foundInPage"
                     (fn [data]
                       (let [data' (bean/->clj data)]
                         (state/set-state! [:ui/find-in-page :matches] data')
                         (dom/remove-style! (dom/by-id "search-in-page-input") :visibility)
                         (dom/set-text! (dom/by-id "search-in-page-placeholder") "")
                         (ui/focus-element "search-in-page-input")
                         true)))

  (js/window.apis.on "loginCallback"
                     (fn [code]
                       (user/login-callback code)))

  (js/window.apis.on "quickCapture"
                     (fn [args]
                       (let [{:keys [url title content]} (bean/->clj args)
                             page (or (state/get-current-page)
                                      (string/lower-case (date/journal-name)))
                             format (db/get-page-format page)
                             time (date/get-current-time)
                             text (or (and content (not-empty (string/trim content))) "")
                             link (if (not-empty title) (config/link-format format title url) url)
                             template (get-in (state/get-config)
                                              [:quick-capture-templates :text]
                                              "**{time}** [[quick capture]]: {text} {url}")
                             content (-> template
                                         (string/replace "{time}" time)
                                         (string/replace "{url}" link)
                                         (string/replace "{text}" text))]
                         (if (and (state/get-edit-block) (state/editing?))
                           (editor-handler/insert content)
                           (editor-handler/api-insert-new-block! content {:page page
                                                                          :edit-block? false
                                                                          :replace-empty-target? true})))))

  (js/window.apis.on "openNewWindowOfGraph"
                     ;; Handle open new window in renderer, until the destination graph doesn't rely on setting local storage
                     ;; No db cache persisting ensured. Should be handled by the caller
                     (fn [repo]
                       (ui-handler/open-new-window! nil repo))))

(defn listen!
  []
  (listen-to-electron!)
  (listen-persistent-dbs!))
