(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]
            [frontend.db :as db]
            [frontend.idb :as idb]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

(defn listen-to-open-dir!
  []
  (js/window.apis.on "open-dir-confirmed"
                     (fn []
                       (state/set-loading-files! true)
                       (when-not (state/home?)
                         (route-handler/redirect-to-home!)))))

(defn run-dirs-watcher!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (watcher-handler/handle-changed! type payload)))))

(defn listen-persistent-dbs!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "persistent-dbs"
                     (fn [req]
                       (p/let [repos (idb/get-nfs-dbs)
                               repos (-> repos
                                         (conj (state/get-current-repo))
                                         (distinct))]
                         (-> (p/all (map db/persist! repos))
                             (p/then (fn []
                                       (ipc/ipc "persistent-dbs-saved")))
                             (p/catch (fn [error]
                                        (js/console.dir error))))))))

(defn listen!
  []
  (listen-to-open-dir!)
  (run-dirs-watcher!)
  (listen-persistent-dbs!))
