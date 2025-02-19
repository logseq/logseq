(ns frontend.handler.file-based.import
  "Handles file-graph specific imports"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.date :as date]
            [frontend.external :as external]
            [frontend.handler.file-based.file :as file-handler]
            [frontend.handler.file-based.repo :as file-repo-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]))


(defn index-files!
  "Create file structure, then parse into DB (client only)"
  [repo files finish-handler]
  (let [titles (->> files
                    (map :title)
                    (remove nil?))
        files (map (fn [file]
                     (let [title (:title file)
                           journal? (date/valid-journal-title? title)]
                       (when-let [text (:text file)]
                         (let [title (or
                                      (when journal?
                                        (date/journal-title->default title))
                                      (string/replace title "/" "-"))
                               title (-> (common-util/page-name-sanity title)
                                         (string/replace "\n" " "))
                               path (str (if journal?
                                           (config/get-journals-directory)
                                           (config/get-pages-directory))
                                         "/"
                                         title
                                         ".md")]
                           {:file/path path
                            :file/content text}))))
                   files)
        files (remove nil? files)]
    (file-repo-handler/parse-files-and-load-to-db! repo files nil)
    (let [files (->> (map (fn [{:file/keys [path content]}] (when path [path content])) files)
                     (remove nil?))]
      (file-handler/alter-files repo files {:add-history? false
                                            :update-db? false
                                            :update-status? false
                                            :finish-handler finish-handler}))
    (let [journal-pages-tx (let [titles (filter date/normalize-journal-title titles)]
                             (map
                              (fn [title]
                                (let [day (date/journal-title->int title)
                                      journal-title (date-time-util/int->journal-title day (state/get-date-formatter))]
                                  (when journal-title
                                    (let [page-name (util/page-name-sanity-lc journal-title)]
                                      {:block/name page-name
                                       :block/type "journal"
                                       :block/journal-day day}))))
                              titles))]
      (when (seq journal-pages-tx)
        (db/transact! repo journal-pages-tx)))))

;; TODO: replace files with page blocks transaction
(defn import-from-roam-json!
  [data finished-ok-handler]
  (when-let [repo (state/get-current-repo)]
    (let [files (external/to-markdown-files :roam data {})]
      (index-files! repo files
                    (fn []
                      (finished-ok-handler))))))