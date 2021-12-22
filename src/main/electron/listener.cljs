(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.fs.sync :as sync]
            [frontend.db :as db]
            [datascript.core :as d]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [frontend.handler.notification :as notification]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.ui :as ui]
            [frontend.db.persist :as db-persist]))

(defn persist-dbs!
  []
  (->
   (p/let [repos (db-persist/get-all-graphs)
           repos (-> repos
                     (conj (state/get-current-repo))
                     (distinct))]
     (if (seq repos)
       (do
         (notification/show!
          (ui/loading "Logseq is saving the graphs to your local file system, please wait for several seconds.")
          :warning)
         (doseq [repo repos]
           (metadata-handler/set-pages-metadata! repo))
         (js/setTimeout
          (fn []
            (-> (p/all (map db/persist! repos))
                (p/then (fn []
                          (ipc/ipc "persistent-dbs-saved")))))
          100))
       (ipc/ipc "persistent-dbs-saved")))
   (p/catch (fn [error]
              (js/console.error error)
              (ipc/ipc "persistent-dbs-error")))))

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
                         (ui-handler/re-render-root!)))))

(defn listen!
  []
  (listen-to-electron!)
  (listen-persistent-dbs!))
