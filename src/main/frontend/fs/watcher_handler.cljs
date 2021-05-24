(ns frontend.fs.watcher-handler
  (:require [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [frontend.handler.file :as file-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [cljs-time.coerce :as tc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.encrypt :as encrypt]))

(defn handle-changed!
  [type {:keys [dir path content stat] :as payload}]
  (when dir
    (let [repo (config/get-local-repo dir)
          {:keys [mtime]} stat]
      (when (and content (not (encrypt/content-encrypted? content)))
        (cond
          (= "add" type)
          (when-not (db/file-exists? repo path)
            (let [_ (file-handler/alter-file repo path content {:re-render-root? true
                                                                :from-disk? true})]
              (db/set-file-last-modified-at! repo path mtime)
              ;; return nil, otherwise the entire db will be transfered by ipc
              nil))

          (and (= "change" type)
               (not (db/file-exists? repo path)))
          (js/console.warn "Can't get file in the db: " path)

          (and (= "change" type)
               (when-let [last-modified-at (db/get-file-last-modified-at repo path)]
                 (> mtime last-modified-at)))
          (let [_ (file-handler/alter-file repo path content {:re-render-root? true
                                                              :from-disk? true})]
            (db/set-file-last-modified-at! repo path mtime)
            nil)

          (contains? #{"add" "change" "unlink"} type)
          nil

          :else
          (log/error :fs/watcher-no-handler {:type type
                                             :payload payload}))))))
