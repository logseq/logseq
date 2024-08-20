(ns frontend.db
  "Main entry ns for db related fns"
  (:require [frontend.db.conn :as conn]
            [frontend.db.model]
            [frontend.db.react :as react]
            [frontend.db.utils]
            [frontend.namespaces :refer [import-vars]]
            [logseq.db :as ldb]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.config :as config]
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
  delete-blocks get-pre-block
  delete-files delete-pages-by-files
  get-block-and-children get-block-by-uuid get-block-children sort-by-order
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks
  get-block-immediate-children get-block-page
  get-custom-css
  get-file-last-modified-at get-file get-file-page get-file-page-id file-exists?
  get-files-blocks get-files-full get-journals-length
  get-latest-journals get-page get-case-page get-page-alias-names
  get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format
  get-referenced-blocks get-page-referenced-blocks-full get-page-referenced-pages
  get-all-pages get-pages-relation get-pages-that-mentioned-page
  journal-page? page? page-alias-set sub-block
  page-empty? page-exists? get-alias-source-page
  has-children? whiteboard-page?
  get-namespace-pages get-all-namespace-relation]

 [frontend.db.react
  get-current-page
  remove-q! remove-query-component! add-q! add-query-component! clear-query-state!
  q
  query-state query-components remove-custom-query! set-new-result!])

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
  (when (and repo path last-modified-at)
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
