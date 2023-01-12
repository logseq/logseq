(ns frontend.db
  "Main entry ns for db related fns"
  (:require [clojure.core.async :as async]
            [datascript.core :as d]
            [logseq.db.schema :as db-schema]
            [frontend.db.conn :as conn]
            [logseq.db.default :as default-db]
            [frontend.db.model]
            [frontend.db.query-custom]
            [frontend.db.query-react]
            [frontend.db.react :as react]
            [frontend.db.utils]
            [frontend.db.persist :as db-persist]
            [frontend.db.migrate :as db-migrate]
            [frontend.namespaces :refer [import-vars]]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

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
  blocks-count blocks-count-cache clean-export! delete-blocks get-pre-block
  delete-files delete-pages-by-files
  filter-only-public-pages-and-blocks get-all-block-contents get-all-tagged-pages
  get-all-templates get-block-and-children get-block-by-uuid get-block-children sort-by-left
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks get-all-referenced-blocks-uuid
  get-block-children-ids get-block-immediate-children get-block-page
  get-custom-css get-date-scheduled-or-deadlines
  get-file-last-modified-at get-file get-file-page get-file-page-id file-exists?
  get-files get-files-blocks get-files-full get-journals-length get-pages-with-file
  get-latest-journals get-page get-page-alias get-page-alias-names get-paginated-blocks
  get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format get-page-properties
  get-page-referenced-blocks get-page-referenced-blocks-full get-page-referenced-pages get-page-unlinked-references
  get-all-pages get-pages get-pages-relation get-pages-that-mentioned-page get-public-pages get-tag-pages
  journal-page? page-alias-set pull-block
  set-file-last-modified-at! page-empty? page-exists? page-empty-or-dummy? get-alias-source-page
  set-file-content! has-children? get-namespace-pages get-all-namespace-relation get-pages-by-name-partition
  get-original-name]

 [frontend.db.react
  get-current-page set-key-value
  remove-key! remove-q! remove-query-component! add-q! add-query-component! clear-query-state!
  clear-query-state-without-refs-and-embeds! kv q
  query-state query-components remove-custom-query! set-new-result! sub-key-value refresh!]

 [frontend.db.query-custom
  custom-query]

 [frontend.db.query-react
  react-query custom-query-result-transform]

 [logseq.db.default built-in-pages-names built-in-pages])

(defn get-schema-version [db]
  (d/q
    '[:find ?v .
      :where
      [_ :schema/version ?v]]
    db))

(defn old-schema?
  [db]
  (let [v (get-schema-version db)]
    (if (integer? v)
      (> db-schema/version v)
      ;; backward compatibility
      true)))

;; persisting DBs between page reloads
(defn persist! [repo]
  (let [key (datascript-db repo)
        db (get-db repo)]
    (when db
      (let [db-str (if db (db->string db) "")]
        (p/let [_ (db-persist/save-graph! key db-str)])))))

(defonce persistent-jobs (atom {}))

(defn clear-repo-persistent-job!
  [repo]
  (when-let [old-job (get @persistent-jobs repo)]
    (js/clearTimeout old-job)))

(defn persist-if-idle!
  [repo]
  (clear-repo-persistent-job! repo)
  (let [job (js/setTimeout
             (fn []
               (if (and (state/input-idle? repo)
                        (state/db-idle? repo))
                 (persist! repo)
                 ;; (state/set-db-persisted! repo true)

                 (persist-if-idle! repo)))
             3000)]
    (swap! persistent-jobs assoc repo job)))

;; only save when user's idle

(defonce *db-listener (atom nil))

(defn- repo-listen-to-tx!
  [repo conn]
  (d/listen! conn :persistence
             (fn [tx-report]
               (when (not (:new-graph? (:tx-meta tx-report))) ; skip initial txs
                 (if (util/electron?)
                   (when-not (:dbsync? (:tx-meta tx-report))
                     ;; sync with other windows if needed
                     (p/let [graph-has-other-window? (ipc/ipc "graphHasOtherWindow" repo)]
                       (when graph-has-other-window?
                         (ipc/ipc "dbsync" repo {:data (db->string (:tx-data tx-report))}))))
                   (do
                     (state/set-last-transact-time! repo (util/time-ms))
                     (persist-if-idle! repo)))

                 (when-let [db-listener @*db-listener]
                   (db-listener repo tx-report))))))

(defn listen-and-persist!
  [repo]
  (when-let [conn (get-db repo false)]
    (d/unlisten! conn :persistence)
    (repo-listen-to-tx! repo conn)))

(defn start-db-conn!
  ([repo]
   (start-db-conn! repo {}))
  ([repo option]
   (conn/start! repo
                (assoc option
                       :listen-handler listen-and-persist!))))

(defn restore-graph-from-text!
  "Swap db string into the current db status
   stored: the text to restore from"
  [repo stored]
  (p/let [db-name (datascript-db repo)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! conns assoc db-name db-conn)
          _ (when stored
              (let [stored-db (try (string->db stored)
                                   (catch :default _e
                                     (js/console.warn "Invalid graph cache")
                                     (d/empty-db db-schema/schema)))
                    attached-db (d/db-with stored-db
                                           default-db/built-in-pages) ;; TODO bug overriding uuids?
                    db (if (old-schema? attached-db)
                         (db-migrate/migrate attached-db)
                         attached-db)]
                (conn/reset-conn! db-conn db)))]
    (d/transact! db-conn [{:schema/version db-schema/version}])))

(defn restore-graph!
  "Restore db from serialized db cache"
  [repo]
  (p/let [db-name (datascript-db repo)
          stored (db-persist/get-serialized-graph db-name)]
    (restore-graph-from-text! repo stored)))

(defn restore!
  [repo]
  (p/let [_ (restore-graph! repo)]
    (listen-and-persist! repo)))

(defn run-batch-txs!
  []
  (let [chan (state/get-db-batch-txs-chan)]
    (async/go-loop []
      (let [f (async/<! chan)]
        (f))
      (recur))
    chan))

(defn new-block-id
  []
  (d/squuid))
