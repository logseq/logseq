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
            [clojure.string :as string]))

(defn handle-changed!
  [type {:keys [dir path content stat] :as payload}]
  (when dir
    (let [repo (config/get-local-repo dir)
          {:keys [mtime]} stat]
      (cond
        (= "add" type)
        (let [db-content (db/get-file path)]
          (when (and (not= content db-content)
                     ;; Avoid file overwrites
                     ;; 1. create a new page which writes a new file
                     ;; 2. add some new content
                     ;; 3. file watcher notified it with the old content
                     ;; 4. old content will overwrites the new content in step 2
                     (not (and db-content
                               (string/starts-with? db-content content))))
            (file-handler/alter-file repo path content {:re-render-root? true
                                                        :from-disk? true})))

        (and (= "change" type)
             (nil? (db/get-file path)))
        (js/console.warn "Can't get file in the db: " path)

        (and (= "change" type)
             (not= content (db/get-file path))
             (when-let [last-modified-at (db/get-file-last-modified-at repo path)]
               (> mtime last-modified-at)))

        (let [_ (file-handler/alter-file repo path content {:re-render-root? true
                                                              :from-disk? true})]
          (db/set-file-last-modified-at! repo path mtime))

        ;; (= "unlink" type)
        ;; (when-let [page-name (db/get-file-page path)]
        ;;   (page-handler/delete!
        ;;    page-name
        ;;    (fn []
        ;;      (notification/show! (str "Page " page-name " was deleted on disk.")
        ;;                          :success)
        ;;      (when (= (state/get-current-page) page-name)
        ;;        ;; redirect to home
        ;;        (route-handler/redirect-to-home!)))))

        (contains? #{"add" "change" "unlink"} type)
        nil

        :else
        (log/error :fs/watcher-no-handler {:type type
                                           :payload payload})))))
