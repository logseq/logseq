(ns frontend.handler.external
  (:require [frontend.external :as external]
            [frontend.handler.file :as file-handler]
            [frontend.handler.common :as common-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.db :as db]))

(defn index-files!
  [repo files git-add-cb]
  (let [titles (->> files
                    (map :title)
                    (map :text)
                    (remove nil?))
        files (map (fn [file]
                     (let [title (:title file)
                           journal? (date/valid-journal-title? title)]
                       (when-let [text (:text file)]
                         (let [path (str (if journal?
                                           config/default-journals-directory
                                           config/default-pages-directory)
                                         "/"
                                         (if journal?
                                           (date/journal-title->default title)
                                           (string/replace title "/" "-"))
                                         ".md")]
                           [path text]))))
                   files)]
    ;; TODO: git add is quite slow
    (file-handler/alter-files repo files {:add-history? false
                                          :update-status? false
                                          :reset? true
                                          :git-add-cb git-add-cb})
    (let [journal-pages-tx (let [titles (filter date/valid-journal-title? titles)]
                             (map
                              (fn [title]
                                (let [page-name (string/lower-case title)]
                                  {:page/name page-name
                                   :page/journal? true
                                   :page/journal-day (date/journal-title->int title)}))
                              titles))]
      (when (seq journal-pages-tx)
        (db/transact! repo journal-pages-tx)))))

(defn import-from-roam-json!
  [data finished-ok-handler]
  (when-let [repo (state/get-current-repo)]
    (let [files (external/to-markdown-files :roam data {})]
      (index-files! repo files
                    (fn []
                      (common-handler/check-changed-files-status)
                      (finished-ok-handler))))))
