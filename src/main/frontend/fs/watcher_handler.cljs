(ns frontend.fs.watcher-handler
  (:require [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [frontend.handler.file :as file-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.notification :as notification]
            [frontend.config :as config]
            [cljs-bean.core :as bean]
            [frontend.db :as db]))

(defn handle-changed!
  [type {:keys [dir path content stat] :as payload}]
  (when dir
    (let [repo (config/get-local-repo dir)
          {:keys [mtime]} stat]
      (cond
        (= "add" type)
        (when (not= content (db/get-file path))
          (file-handler/alter-file repo path content {:re-render-root? true}))

        (and (= "change" type)
             (not= content (db/get-file path))
             (when-let [last-modified-at (db/get-file-last-modified-at repo path)]
               (> mtime last-modified-at)))
        (file-handler/alter-file repo path content {:re-render-root? true})

        (= "unlink" type)
        (when-let [page-name (db/get-file-page path)]
          (page-handler/delete!
           page-name
           (fn []
             (notification/show! (str "Page " page-name " was deleted on disk.")
                                 :success))))

        (contains? #{"add" "change" "unlink"} type)
        nil

        :else
        (log/error :fs/watcher-no-handler {:type type
                                           :payload payload})))))

(defn run-dirs-watcher!
  []
  ;; TODO: move "file-watcher" to electron.ipc.channels
  (js/window.apis.on "file-watcher"
                     (fn [data]
                       (let [{:keys [type payload]} (bean/->clj data)]
                         (handle-changed! type payload)))))
