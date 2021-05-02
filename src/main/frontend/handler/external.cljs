(ns frontend.handler.external
  (:require [frontend.external :as external]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.common :as common-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.db :as db]))

(defonce debug-files (atom nil))
(defn index-files!
  [repo files finish-handler]
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
                                           (config/get-pages-directory))
                                         "/"
                                         (if journal?
                                           (date/journal-title->default title)
                                           (string/replace title "/" "-"))
                                         ".md")]
                           {:file/path path
                            :file/content text}))))
                   files)
        files (remove nil? files)
        _ (reset! debug-files files)]
    (repo-handler/parse-files-and-load-to-db! repo files nil)
    (let [files (map (fn [{:file/keys [path content]}] [path content]) files)]
      (file-handler/alter-files repo files {:add-history? false
                                            :update-db? false
                                            :update-status? false
                                            :finish-handler finish-handler}))
    (let [journal-pages-tx (let [titles (filter date/valid-journal-title? titles)]
                             (map
                              (fn [title]
                                (let [page-name (string/lower-case title)]
                                  {:block/name page-name
                                   :block/journal? true
                                   :block/journal-day (date/journal-title->int title)}))
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
