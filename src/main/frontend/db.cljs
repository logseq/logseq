(ns frontend.db
  "Main entry ns for db related fns"
  (:require [frontend.config :as config]
            [frontend.db.conn :as conn]
            [frontend.db.model]
            [frontend.db.utils]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.namespaces :refer [import-vars]]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.outliner.op]))

(import-vars
 [frontend.db.conn
  ;; TODO: remove later
  get-repo-path
  get-repo-name
  get-short-repo-name
  get-db
  remove-conn!]

 [frontend.db.utils
  entity pull pull-many]

 [frontend.db.model
  delete-files get-block-and-children get-block-by-uuid sort-by-order
  get-block-parent get-block-parents parents-collapsed?
  get-block-immediate-children get-block-page
  get-file file-exists?  get-files-full
  get-latest-journals get-page get-case-page get-page-alias-names
  get-page-format journal-page? page? sub-block
  page-empty? page-exists? get-alias-source-page
  has-children? whiteboard-page?])

(defn start-db-conn!
  ([repo]
   (start-db-conn! repo {}))
  ([repo option]
   (conn/start! repo option)))

(def new-block-id ldb/new-block-id)

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data nil))
  ([repo tx-data]
   (transact! repo tx-data nil))
  ([repo tx-data tx-meta]
   (if config/publishing?
     ;; :save-block is for query-table actions like sorting and choosing columns
     (when (or (#{:collapse-expand-blocks :save-block} (:outliner-op tx-meta))
               (:init-db? tx-meta))
       (conn/transact! repo tx-data tx-meta))
     (ui-outliner-tx/transact! tx-meta
                               (outliner-op/transact! tx-data tx-meta)))))

(defn set-file-last-modified-at!
  "Refresh file timestamps to DB"
  [repo path last-modified-at]
  (when (and repo (not (config/db-based-graph? repo)) path last-modified-at)
    (transact! repo
               [{:file/path path
                 :file/last-modified-at last-modified-at}] {})))

(defn set-file-content!
  ([repo path content]
   (set-file-content! repo path content {}))
  ([repo path content opts]
   (when (and repo path)
     (let [tx-data {:file/path path
                    :file/content content}]
       (transact! repo [tx-data] opts)))))
