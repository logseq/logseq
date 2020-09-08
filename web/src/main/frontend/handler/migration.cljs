(ns frontend.handler.migration
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.db :as db]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.git :as git]
            [clojure.string :as str]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.git :as git-handler]
            [frontend.fs :as fs]))

(defn get-files-from-blocks
  [blocks]
  (if (<= (count blocks) 1)
    nil
    {:path (str config/default-journals-directory "/" (:title blocks) "." (config/get-file-extension (state/get-preferred-format)))
     :page (reduce #(if (not (str/blank? (:block/content %2))) (str %1 (:block/content %2)) %1) "" (:page blocks))}))

(defn handle-journal-migration-from-monthly-to-daily!
  [repo]
  (repo-handler/set-config! :journal-basis "daily")
  (let [all-journals (->>
                      (db/q repo [:journals] {:use-cache? false}
                            '[:find ?page-name
                              :where
                              [?page :page/journal? true]
                              [?page :page/original-name ?page-name]])
                      (db/react)
                      (map first)
                      (map (fn [el] {:title el :page (db/get-page-blocks repo el)}))
                      (util/remove-nils)
                      (map get-files-from-blocks))
        journals-dir (str (frontend.util/get-repo-dir repo) "/journals")]

    (frontend.util/p-handle
     (frontend.fs/readdir journals-dir)
     (fn [files]
       (let [to-delete (reduce #(if (re-matches #"[0-9]{4}_[0-9]{2}.*" %2) (concat [(str "journals/" %2)] %1) %1) [] (js->clj files))]
         (doall (map #(file-handler/remove-file! repo %) to-delete))
         (doall (map (fn [{:keys [path page]}]
                       (println "migrating" path)
                       (p/let [file-exists? (fs/create-if-not-exists (util/get-repo-dir repo) path page)]
                         (db/reset-file! repo path page)
                         (ui-handler/re-render-root!)
                         (git-handler/git-add repo path))) all-journals))))
     #(println "Migration failed"))))