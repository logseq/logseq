(ns electron.listener
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [cljs-bean.core :as bean]
            [frontend.fs.watcher-handler :as watcher-handler]))

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

(defn listen!
  []
  (listen-to-open-dir!)
  (run-dirs-watcher!))
