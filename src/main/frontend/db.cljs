(ns frontend.db
  "Main entry ns for db related fns"
  (:require [frontend.db.conn :as conn]
            [frontend.db.model]
            [frontend.db.query-custom]
            [frontend.db.query-react]
            [frontend.db.react :as react]
            [frontend.db.transact :as db-transact]
            [frontend.db.utils]
            [frontend.namespaces :refer [import-vars]]
            [logseq.db :as ldb]))

(import-vars
 [frontend.db.conn
  ;; TODO: remove later
  conns
  get-repo-path
  get-repo-name
  get-short-repo-name
  datascript-db
  get-db
  remove-conn!]

 [frontend.db.utils
  group-by-page seq-flatten
  entity pull pull-many transact! get-key-value]

 [frontend.db.model
  delete-blocks get-pre-block
  delete-files delete-pages-by-files get-all-tagged-pages
  get-block-and-children get-block-by-uuid get-block-children sort-by-left
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks
  get-block-immediate-children get-block-page
  get-custom-css
  get-file-last-modified-at get-file get-file-page get-file-page-id file-exists?
  get-files-blocks get-files-full get-journals-length get-pages-with-file
  get-latest-journals get-page get-page-alias get-page-alias-names
  get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format
  get-page-referenced-blocks get-page-referenced-blocks-full get-page-referenced-pages
  get-all-pages get-pages-relation get-pages-that-mentioned-page get-tag-pages
  journal-page? page? page-alias-set sub-block
  set-file-last-modified-at! page-empty? page-exists? get-alias-source-page
  set-file-content! has-children? whiteboard-page?
  get-namespace-pages get-all-namespace-relation]

 [frontend.db.react
  get-current-page set-key-value
  remove-key! remove-q! remove-query-component! add-q! add-query-component! clear-query-state!
  kv q
  query-state query-components remove-custom-query! set-new-result! sub-key-value]

 [frontend.db.query-custom
  custom-query]

 [frontend.db.query-react
  react-query custom-query-result-transform])

(defn start-db-conn!
  ([repo]
   (start-db-conn! repo {}))
  ([repo option]
   (conn/start! repo option)))

(def new-block-id ldb/new-block-id)
(def request-finished? db-transact/request-finished?)
