(ns frontend.handler.common.file
  "Common file related fns for handlers"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]
            [frontend.fs :as fs]
            [frontend.context.i18n :refer [t]]
            [clojure.string :as string]
            [promesa.core :as p]))

(defn- page-exists-in-another-file
  "Conflict of files towards same page"
  [repo-url page file]
  (when-let [page-name (:block/name page)]
    (let [current-file (:file/path (db/get-page-file repo-url page-name))]
      (when (not= file current-file)
        current-file))))

(defn- validate-existing-file
  [repo-url file-page file-path]
  (when-let [current-file (page-exists-in-another-file repo-url file-page file-path)]
    (when (not= file-path current-file)
      (cond
        (= (string/lower-case current-file)
           (string/lower-case file-path))
        ;; case renamed
        (when-let [file (db/pull [:file/path current-file])]
          (p/let [disk-content (fs/read-file "" current-file)]
            (fs/backup-db-file! repo-url current-file (:file/content file) disk-content))
          (db/transact! repo-url [{:db/id (:db/id file)
                                   :file/path file-path}]))

        :else
        (let [error (t :file/validate-existing-file-error current-file file-path)]
          (state/pub-event! [:notification/show
                             {:content error
                              :status :error
                              :clear? false}]))))))

(defn- validate-and-get-blocks-to-delete
  [repo-url db file-page file-path retain-uuid-blocks]
  (validate-existing-file repo-url file-page file-path)
  (graph-parser/get-blocks-to-delete db file-page file-path retain-uuid-blocks))

(defn reset-file!
  "Main fn for updating a db with the results of a parsed file"
  ([repo-url file-path content]
   (reset-file! repo-url file-path content {}))
  ([repo-url file-path content {:keys [verbose] :as options}]
   (let [new? (nil? (db/entity [:file/path file-path]))
         options (merge (dissoc options :verbose)
                        {:new? new?
                         :delete-blocks-fn (partial validate-and-get-blocks-to-delete repo-url)
                         ;; Options here should also be present in gp-cli/parse-graph
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file-path))
                                            :supported-formats (gp-config/supported-formats)
                                            :filename-format (state/get-filename-format repo-url)
                                            :extracted-block-ids (:extracted-block-ids options)}
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (graph-parser/parse-file (db/get-db repo-url false) file-path content options)))))
