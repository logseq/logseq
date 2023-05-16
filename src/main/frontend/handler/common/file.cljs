(ns frontend.handler.common.file
  "Common file related fns for handlers"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.util :as gp-util]
            [frontend.fs.diff-merge :as diff-merge]
            [frontend.fs :as fs]
            [frontend.context.i18n :refer [t]]
            [promesa.core :as p]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [lambdaisland.glogi :as log]))

(defn- page-exists-in-another-file
  "Conflict of files towards same page"
  [repo-url page file]
  (when-let [page-name (:block/name page)]
    (let [current-file (:file/path (db/get-page-file repo-url page-name))]
      (when (not= file current-file)
        current-file))))

(defn- validate-existing-file
  "Handle the case when the file is already exists in db
     Likely caused by renaming between caps and non-caps, then cause file system 
     bugs on some OS
     e.g. on macOS, it doesn't fire the file change event when renaming between 
       caps and non-caps"
  [repo-url file-page file-path]
  (when-let [current-file (page-exists-in-another-file repo-url file-page file-path)]
    (when (not= file-path current-file)
      (cond
        ;; TODO: handle case sensitive file system
        (= (gp-util/path-normalize (string/lower-case current-file))
           (gp-util/path-normalize (string/lower-case file-path)))
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
  "An implementation for the delete-blocks-fn in graph-parser/parse-file"
  [repo-url db file-page file-path retain-uuid-blocks]
  (validate-existing-file repo-url file-page file-path)
  (graph-parser/get-blocks-to-delete db file-page file-path retain-uuid-blocks))

(defn- diff-merge-uuids-2ways
  "Infer new uuids from existing DB data and diff with the new AST
   Return a list of uuids for the new blocks"
  [format ast content {:keys [page-name] :as options}]
  (try
    (let [base-diffblocks (diff-merge/db->diff-blocks page-name)
          income-diffblocks (diff-merge/ast->diff-blocks ast content format options)
          diff-ops (diff-merge/diff base-diffblocks income-diffblocks)
          new-uuids (diff-merge/attachUUID diff-ops (map :uuid base-diffblocks))]
      (bean/->clj new-uuids))
    (catch js/Error e
      (log/error :diff-merge/diff-merge-2way-calling-failed e))))

(defn- reset-file!*
  "Parse file considering diff-merge with local or remote file
   Decide how to treat the parsed file based on the file's triggering event
   options - 
     :fs/reset-event - the event that triggered the file update
       :fs/local-file-change - file changed on local disk
       :fs/remote-file-change - file changed on remote"
  [repo-url file-path content {:fs/keys [event] :as options}]
  (let [db-conn (db/get-db repo-url false)]
    (case event
      ;; the file is already in db, so we can use the existing file's blocks
      ;; to do the diff-merge
      :fs/local-file-change
      (graph-parser/parse-file db-conn file-path content (assoc-in options [:extract-options :resolve-uuid-fn] diff-merge-uuids-2ways))

      ;; TODO Junyi: 3 ways to handle remote file change
      ;; The file is on remote, so we should have 
      ;;   1. a "common ancestor" file locally
      ;;     the worst case is that the file is not in db, so we should use the
      ;;     empty file as the common ancestor
      ;;   2. a "remote version" just fetched from remote

      ;; default to parse the file
      (graph-parser/parse-file db-conn file-path content options))))

(defn reset-file!
  "Main fn for updating a db with the results of a parsed file"
  ([repo-url file-path content]
   (reset-file! repo-url file-path content {}))
  ([repo-url file-path content {:keys [verbose extracted-block-ids] :as options}]
   (let [new? (nil? (db/entity [:file/path file-path]))
         options (merge (dissoc options :verbose :extracted-block-ids)
                        {:new? new?
                         :delete-blocks-fn (partial validate-and-get-blocks-to-delete repo-url)
                         ;; Options here should also be present in gp-cli/parse-graph
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file-path))
                                            :filename-format (state/get-filename-format repo-url)}
                                           ;; To avoid skipping the `:or` bounds for keyword destructuring
                                           (when (some? extracted-block-ids) {:extracted-block-ids extracted-block-ids})
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (reset-file!* repo-url file-path content options)))))
