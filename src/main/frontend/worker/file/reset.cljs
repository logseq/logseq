(ns frontend.worker.file.reset
  "Fns for resetting a db file with parsed file content"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.db :as gp-db]))

(defn- page-exists-in-another-file
  "Conflict of files towards same page"
  [db page file]
  (when-let [page-name (:block/name page)]
    (let [current-file (:file/path (gp-db/get-page-file db page-name))]
      (when (not= file current-file)
        current-file))))

(defn- validate-existing-file
  "Handle the case when the file is already exists in db
     Likely caused by renaming between caps and non-caps, then cause file system
     bugs on some OS
     e.g. on macOS, it doesn't fire the file change event when renaming between
       caps and non-caps"
  [repo conn file-page file-path]
  (when-let [current-file-path (page-exists-in-another-file @conn file-page file-path)]
    (when (not= file-path current-file-path)
      (cond
        ;; TODO: handle case sensitive file system
        (= (common-util/path-normalize (string/lower-case current-file-path))
           (common-util/path-normalize (string/lower-case file-path)))
        ;; case renamed
        (when-let [file (d/entity @conn [:file/path current-file-path])]
          (worker-util/post-message :backup-file
                                    [repo current-file-path (:file/content file)])
          (ldb/transact! conn [{:db/id (:db/id file)
                                :file/path file-path}]))

        :else
        (worker-util/post-message :notify-existing-file
                                  [{:current-file-path current-file-path
                                    :file-path file-path}])))))

(defn- validate-and-get-blocks-to-delete
  "An implementation for the delete-blocks-fn in graph-parser/parse-file"
  [repo conn file-page file-path retain-uuid-blocks]
  (validate-existing-file repo conn file-page file-path)
  (graph-parser/get-blocks-to-delete @conn file-page file-path retain-uuid-blocks))

(defn- reset-file!*
  "Parse file.
   Decide how to treat the parsed file based on the file's triggering event
   options -
     :fs/reset-event - the event that triggered the file update
     :fs/local-file-change - file changed on local disk
     :fs/remote-file-change - file changed on remote"
  [db-conn file-path content options]
  (graph-parser/parse-file db-conn file-path content options))

(defn reset-file!
  "Main fn for updating a db with the results of a parsed file"
  ([repo conn file-path content]
   (reset-file! repo conn file-path content {}))
  ([repo conn file-path content {:keys [verbose _ctime _mtime] :as options}]
   (let [config (worker-state/get-config repo)
         options (merge (dissoc options :verbose)
                        {:delete-blocks-fn (partial validate-and-get-blocks-to-delete repo conn)
                         ;; Options here should also be present in gp-cli/parse-graph
                         :extract-options (merge
                                           {:user-config config
                                            :date-formatter (worker-state/get-date-formatter repo)
                                            :block-pattern (common-config/get-block-pattern
                                                            (or (common-util/get-format file-path) :markdown))
                                            :filename-format (:file/name-format config)}
                                           ;; To avoid skipping the `:or` bounds for keyword destructuring
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (reset-file!* conn file-path content options)))))
