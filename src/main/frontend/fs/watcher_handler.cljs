(ns frontend.fs.watcher-handler
  (:require [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [frontend.handler.file :as file-handler]
            [frontend.handler.page :as page-handler]
            [frontend.config :as config]
            [cljs-bean.core :as bean]))

(defn handle-changed!
  [type {:keys [dir path content stat] :as payload}]
  (when dir
    (let [repo (config/get-local-repo dir)]
      (prn "handle file notifier: "
           {:repo repo
            :type type
            :payload payload})
     ;; (cond
     ;;   (contains? #{"add" "change"} type)
     ;;   ;; TODO: check content and mtime
     ;;   (file-handler/alter-file repo path content {})

     ;;   (= "unlink" type)
     ;;   ;; TODO: Remove page and blocks too
     ;;   ;; what if it's a mistaken, should we put it to .trash to have a way to restore it back?
     ;;   (file-handler/remove-file! repo path)

     ;;   :else
     ;;   (log/error :fs/watcher-no-handler {:type type
     ;;                                      :payload payload}))
     )))

(defn run-dirs-watcher!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (handle-changed! type payload)))))
