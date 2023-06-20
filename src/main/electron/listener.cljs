(ns electron.listener
  "System-component-like ns that defines listeners by event name to receive ipc
  messages from electron's main process"
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.fs.sync :as sync]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user]
            [frontend.handler.search :as search-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.common.path :as path]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [promesa.core :as p]))

(defn- safe-api-call
  "Force the callback result to be nil, otherwise, ipc calls could lead to
  window crash."
  [k f]
  (js/window.apis.on k (fn [data] (f data) nil)))

(defn persist-dbs!
  []
  ;; only persist current db!
  ;; TODO rename the function and event to persist-db
  (repo-handler/persist-db! {:before     #(ui/notify-graph-persist!)
                             :on-success #(ipc/ipc "persistent-dbs-saved")
                             :on-error   #(ipc/ipc "persistent-dbs-error")}))


(defn listen-persistent-dbs!
  []
  (safe-api-call "persistent-dbs" (fn [_data] (persist-dbs!))))


(defn ^:large-vars/cleanup-todo listen-to-electron!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (safe-api-call "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)
                             path (gp-util/path-normalize (:path payload))
                             dir (:dir payload)
                             payload (assoc payload :path (path/relative-path dir path))]
                         (watcher-handler/handle-changed! type payload)
                         (when (file-sync-handler/enable-sync?)
                           (sync/file-watch-handler type payload)))))

  (safe-api-call "file-sync-progress"
                 (fn [data]
                   (let [payload (bean/->clj data)]
                     (state/set-state! [:file-sync/graph-state (:graphUUID payload) :file-sync/progress (:file payload)] payload))))

  (safe-api-call "notification"
                 (fn [data]
                   (let [{:keys [type payload]} (bean/->clj data)
                         type (keyword type)
                         comp [:div (str payload)]]
                     (notification/show! comp type false))))

  (safe-api-call "graphUnlinked"
                 (fn [data]
                   (let [repo (bean/->clj data)]
                     (repo-handler/remove-repo! repo))))

  (safe-api-call "rebuildSearchIndice"
                 (fn [_data]
                   (prn "Rebuild search indices")
                   (search-handler/rebuild-indices!)))

  (safe-api-call "setGitUsernameAndEmail"
                 (fn []
                   (state/pub-event! [:modal/set-git-username-and-email])))

  (safe-api-call "getCurrentGraph"
                 (fn []
                   (when-let [graph (state/get-current-repo)]
                     (ipc/ipc "setCurrentGraph" graph))))

  (safe-api-call "redirect"
                 (fn [data]
                   (let [{:keys [payload]} (bean/->clj data)
                         payload (update payload :to keyword)]
                     (route-handler/redirect! payload))))

  (safe-api-call "redirectWhenExists"
                 ;;  Redirect to the given page or block when the provided page or block exists.
                 ;;  Either :page-name or :block-id is required.
                 ;;  :page-name : the original-name of the page.
                 ;;  :block-id : uuid.
                 (fn [data]
                   (let [{:keys [page-name block-id file]} (bean/->clj data)]
                     (cond
                       page-name
                       (let [db-page-name (db-model/get-redirect-page-name page-name)
                             whiteboard? (db-model/whiteboard-page? db-page-name)]
                         ;; No error handling required, as a page name is always valid
                         ;; Open new page if the page does not exist
                         (if whiteboard?
                           (route-handler/redirect-to-whiteboard! page-name {:block-id block-id})
                           (editor-handler/insert-first-page-block-if-not-exists! db-page-name)))

                       block-id
                       (if-let [block (db-model/get-block-by-uuid block-id)]
                         (if (gp-whiteboard/shape-block? block)
                          (route-handler/redirect-to-whiteboard! (get-in block [:block/page :block/name]) {:block-id block-id})
                          (route-handler/redirect-to-page! block-id))
                         (notification/show! (str "Open link failed. Block-id `" block-id "` doesn't exist in the graph.") :error false))

                       file
                       (if-let [db-page-name (db-model/get-file-page file false)]
                         (route-handler/redirect-to-page! db-page-name)
                         (notification/show! (str "Open link failed. File `" file "` doesn't exist in the graph.") :error false))))))

  (safe-api-call "dbsync"
                 (fn [data]
                   (let [{:keys [graph tx-data]} (bean/->clj data)
                         tx-data (db/string->db (:data tx-data))]
                     (when-let [conn (db/get-db graph false)]
                       (d/transact! conn tx-data {:dbsync? true}))
                     (ui-handler/re-render-root!))))

  (safe-api-call "persistGraph"
                 ;; electron is requesting window for persisting a graph in it's db
                 ;; fire back "broadcastPersistGraphDone" on done
                 (fn [data]
                   (let [repo (bean/->clj data)
                         before-f #(ui/notify-graph-persist!)
                         after-f #(ipc/ipc "broadcastPersistGraphDone")
                         error-f (fn []
                                   (after-f)
                                   (ui/notify-graph-persist-error!))
                         handlers {:before     before-f
                                   :on-success after-f
                                   :on-error   error-f}]
                     (repo-handler/persist-db! repo handlers))))

  (safe-api-call "foundInPage"
                 (fn [data]
                   (let [data' (bean/->clj data)]
                     (state/set-state! [:ui/find-in-page :matches] data')
                     (dom/remove-style! (dom/by-id "search-in-page-input") :visibility)
                     (dom/set-text! (dom/by-id "search-in-page-placeholder") "")
                     (ui/focus-element "search-in-page-input"))))

  (safe-api-call "loginCallback"
                 (fn [code]
                   (user/login-callback code)))

  (safe-api-call "quickCapture"
                 (fn [args]
                   (state/pub-event! [:editor/quick-capture args])))

  (safe-api-call "openNewWindowOfGraph"
                 ;; Handle open new window in renderer, until the destination graph doesn't rely on setting local storage
                 ;; No db cache persisting ensured. Should be handled by the caller
                 (fn [repo]
                   (ui-handler/open-new-window! repo)))

  (safe-api-call "invokeLogseqAPI"
                 (fn [^js data]
                   (let [sync-id (.-syncId data)
                         method  (.-method data)
                         args    (.-args data)
                         ret-fn! #(ipc/invoke (str :electron.server/sync! sync-id) %)]

                     (try
                       (println "invokeLogseqAPI:" method)
                       (let [^js apis (aget js/window.logseq "api")]
                         (when-not (aget apis method)
                           (throw (js/Error. (str "MethodNotExist: " method))))
                         (-> (p/promise (apply js-invoke apis method args))
                             (p/then #(ret-fn! %))
                             (p/catch #(ret-fn! {:error %}))))
                       (catch js/Error e
                         (ret-fn! {:error (.-message e)}))))))

  (safe-api-call "syncAPIServerState"
                 (fn [^js data]
                   (state/set-state! :electron/server (bean/->clj data)))))

(defn listen!
  []
  (listen-to-electron!)
  (listen-persistent-dbs!))
