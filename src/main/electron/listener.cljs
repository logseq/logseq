(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.fs.sync :as sync]
            [frontend.db :as db]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.ui :as ui]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user]
            [frontend.db.persist :as db-persist]))

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

(defn listen-to-electron!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (watcher-handler/handle-changed! type payload)
                         (sync/file-watch-handler type payload))))

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

  (js/window.apis.on "dbsync"
                     (fn [data]
                       (let [{:keys [graph tx-data]} (bean/->clj data)
                             tx-data (db/string->db (:data tx-data))]
                         (when-let [conn (db/get-conn graph false)]
                           (d/transact! conn tx-data {:dbsync? true}))
                         (ui-handler/re-render-root!))))

  (js/window.apis.on "persistGraph"
                     ;; electron is requesting window for persisting a graph in it's db
                     (fn [data]
                       (let [repo (bean/->clj data)
                             before-f #(notification/show!
                                        (ui/loading (t :graph/persist))
                                        :warning)
                             after-f #(ipc/ipc "persistGraphDone" repo)
                             error-f (fn []
                                       (after-f)
                                       (notification/show!
                                        (t :graph/persist-error)
                                        :error))
                             handlers {:before     before-f
                                       :on-success after-f
                                       :on-error   error-f}]
                         (repo-handler/persist-db! repo handlers))))

  (js/window.apis.on "loginCallback"
                     (fn [code]
                       (user/login-callback code))))

(defn listen!
  []
  (listen-to-electron!)
  (listen-persistent-dbs!))
