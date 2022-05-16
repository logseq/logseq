(ns frontend.handler.external
  (:require [frontend.external :as external]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.block :as block]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [frontend.handler.page :as page]
            [frontend.handler.editor :as editor]
            [frontend.util :as util]))

(defn index-files!
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
                               title (-> (gp-util/page-name-sanity title)
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
    (repo-handler/parse-files-and-load-to-db! repo files nil)
    (let [files (->> (map (fn [{:file/keys [path content]}] (when path [path content])) files)
                     (remove nil?))]
      (file-handler/alter-files repo files {:add-history? false
                                            :update-db? false
                                            :update-status? false
                                            :finish-handler finish-handler}))
    (let [journal-pages-tx (let [titles (filter date/valid-journal-title? titles)]
                             (map
                              (fn [title]
                                (let [day (date/journal-title->int title)
                                      page-name (util/page-name-sanity-lc (date-time-util/int->journal-title day (state/get-date-formatter)))]
                                  {:block/name page-name
                                   :block/journal? true
                                   :block/journal-day day}))
                              titles))]
      (when (seq journal-pages-tx)
        (db/transact! repo journal-pages-tx)))))

(defn import-from-roam-json!
  [data finished-ok-handler]
  (when-let [repo (state/get-current-repo)]
    (let [files (external/to-markdown-files :roam data {})]
      (index-files! repo files
                    (fn []
                      (finished-ok-handler))))))


;;; import OPML files
(defn import-from-opml!
  [data finished-ok-handler]
  #_:clj-kondo/ignore
  (when-let [repo (state/get-current-repo)]
    (let [[headers parsed-blocks] (mldoc/opml->edn data)
          parsed-blocks (->>
                         (block/extract-blocks parsed-blocks "" true :markdown)
                         (mapv editor/wrap-parse-block))
          page-name (:title headers)]
      (when (not (db/page-exists? page-name))
        (page/create! page-name {:redirect? false}))
      (let [page-block (db/entity [:block/name (util/page-name-sanity-lc page-name)])
            children (:block/_parent page-block)
            blocks (db/sort-by-left children page-block)
            last-block (last blocks)
            snd-last-block (last (butlast blocks))
            [target-block sibling?] (if (and last-block (seq (:block/content last-block)))
                                      [last-block true]
                                      (if snd-last-block
                                        [snd-last-block true]
                                        [page-block false]))]
        (editor/paste-blocks
         parsed-blocks
         {:target-block target-block
          :sibling? sibling?})
        (finished-ok-handler [page-name])))))
