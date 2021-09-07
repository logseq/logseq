(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.db :as db]
            [frontend.idb :as idb]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [frontend.handler.notification :as notification]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.ui :as ui]))

(defn persist-dbs!
  []
  (->
   (p/let [repos (idb/get-nfs-dbs)
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
  (js/window.apis.on "open-dir-confirmed"
                     (fn []
                       (state/set-loading-files! true)
                       (when-not (state/home?)
                         (route-handler/redirect-to-home!))))

  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (watcher-handler/handle-changed! type payload))))

  (js/window.apis.on "notification"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)
                             type (keyword type)
                             comp [:div (str payload)]]
                         (notification/show! comp type false))))

  (js/window.apis.on "setGitUsernameAndEmail"
                     (fn []
                       (state/pub-event! [:modal/set-git-username-and-email]))))

(defn listen!
  []
  (listen-to-electron!)
  (listen-persistent-dbs!))
