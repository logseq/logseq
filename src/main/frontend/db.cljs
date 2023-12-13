(ns frontend.db
  "Main entry ns for db related fns"
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.model]
            [frontend.db.query-custom]
            [frontend.db.query-react]
            [frontend.db.react :as react]
            [frontend.db.utils]
            [frontend.namespaces :refer [import-vars]]
            [logseq.db.frontend.default :as default-db]))

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
  db->json db->edn-str db->string get-max-tx-id get-tx-id
  group-by-page seq-flatten
  string->db

  entity pull pull-many transact! get-key-value]

 [frontend.db.model
  delete-blocks get-pre-block
  delete-files delete-pages-by-files get-all-block-contents get-all-tagged-pages get-single-block-contents
  get-all-templates get-block-and-children get-block-by-uuid get-block-children sort-by-left
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks get-all-referenced-blocks-uuid
  get-block-immediate-children get-block-page
  get-custom-css get-date-scheduled-or-deadlines
  get-file-last-modified-at get-file get-file-page get-file-page-id file-exists?
  get-files get-files-blocks get-files-full get-journals-length get-pages-with-file
  get-latest-journals get-page get-page-alias get-page-alias-names
  get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format get-page-properties
  get-page-referenced-blocks get-page-referenced-blocks-full get-page-referenced-pages get-page-unlinked-references
  get-all-pages get-pages get-pages-relation get-pages-that-mentioned-page get-tag-pages
  journal-page? page-alias-set sub-block
  set-file-last-modified-at! page-empty? page-exists? page-empty-or-dummy? get-alias-source-page
  set-file-content! has-children? get-namespace-pages get-all-namespace-relation get-pages-by-name-partition
  get-original-name]

 [frontend.db.react
  get-current-page set-key-value
  remove-key! remove-q! remove-query-component! add-q! add-query-component! clear-query-state!
  kv q
  query-state query-components remove-custom-query! set-new-result! sub-key-value refresh!]

 [frontend.db.query-custom
  custom-query]

 [frontend.db.query-react
  react-query custom-query-result-transform]

 [logseq.db.frontend.default built-in-pages-names built-in-pages])

(defn start-db-conn!
  ([repo]
   (start-db-conn! repo {}))
  ([repo option]
   (conn/start! repo option)))

(defn new-block-id
  []
  (d/squuid))
