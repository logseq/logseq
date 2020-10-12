(ns frontend.handler.migration
  (:require [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.ui :as ui]
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
  (if (<= (count (:page blocks)) 1)
    nil
    {:path (str config/default-journals-directory "/" (date/journal-title->default (:title blocks)) "." (config/get-file-extension (state/get-preferred-format)))
     :page (reduce #(if (not (str/blank? (:block/content %2))) (str %1 (:block/content %2)) %1) "" (:page blocks))}))

(defn handle-journal-migration-from-monthly-to-daily!
  [repo]
  (state/set-daily-migrating! true)
  (let [all-journals (->>
                      (db/q repo [:journals] {:use-cache? false}
                            '[:find ?page-name
                              :where
                              [?page :page/journal? true]
                              [?page :page/original-name ?page-name]])
                      (db/react)
                      (map first)
                      (distinct)
                      (map (fn [el] {:title el :page (db/get-page-blocks repo el)}))
                      (util/remove-nils)
                      (map get-files-from-blocks)
                      (remove nil?))
        all-files (map first (db/get-files repo))]
    (let [to-delete (filter #(re-find #"journals/[0-9]{4}_[0-9]{2}\.+" %) all-files)]
      (-> (p/all (doall (map (fn [{:keys [path page]}]
                               (println "migrating" path)
                               (p/let [file-exists? (fs/create-if-not-exists (util/get-repo-dir repo) path page)]
                                 (db/reset-file! repo path page)
                                 (git-handler/git-add repo path))) all-journals)))
          (p/then
           (fn [_result]
             (let [remove-files (doall (map (fn [path]
                                              (db/delete-file! repo path)
                                              (file-handler/remove-file! repo path)) to-delete))]
               (-> (p/all remove-files)
                   (p/then (fn [result]
                             (println "Migration successfully!")
                             (state/set-daily-migrating! false)
                             (ui-handler/re-render-root!)
                             (notification/show!
                              "Migration successfully! Please re-index your repository after the sync indicator turned green for a smooth experience."
                              :success)))
                   (p/catch (fn [error]
                              (state/set-daily-migrating! false)
                              (println "Migration failed: ")
                              (js/console.dir error)))))))))))

(defn show!
  []
  (when-let [current-repo (state/get-current-repo)]
    (when (db/monthly-journals-exists? current-repo)
      (notification/show!
       [:div
        [:p "Logseq is migrating to creating journal pages on a daily basis for better performance and data safety. In the future, the current method of storing journal files once a month would be removed. Please click the following button to migrate, and feel free to let us know if anything unexpected happened!"]
        (ui/button "Begin migration"
                   :on-click #(handle-journal-migration-from-monthly-to-daily! current-repo))]
       :warning
       false))))
