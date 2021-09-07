(ns frontend.db
  (:require [clojure.core.async :as async]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.default :as default-db]
            [frontend.db.model]
            [frontend.db.query-custom]
            [frontend.db.query-react]
            [frontend.db.react]
            [frontend.idb :as idb]
            [frontend.namespaces :refer [import-vars]]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(import-vars
 [frontend.db.conn
  ;; TODO: remove later
  conns
  get-repo-path
  datascript-db
  remove-db!
  get-conn
  me-tx
  remove-conn!]

 [frontend.db.utils
  date->int db->json db->edn-str db->string get-max-tx-id get-tx-id
  group-by-page seq-flatten sort-by-pos
  string->db with-repo

  entity pull pull-many transact! get-key-value]

 [frontend.db.model
  block-and-children-transform blocks-count blocks-count-cache clean-export!  cloned? delete-blocks get-pre-block
  delete-file! delete-file-blocks! delete-file-pages! delete-file-tx delete-files delete-pages-by-files
  filter-only-public-pages-and-blocks get-all-block-contents get-all-tagged-pages
  get-all-templates get-block-and-children get-block-by-uuid get-block-children sort-by-left
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks
  get-block-children-ids get-block-immediate-children get-block-page
  get-blocks-contents get-custom-css
  get-date-scheduled-or-deadlines get-db-type get-file
  get-file-blocks get-file-contents get-file-last-modified-at get-file-no-sub get-file-page get-file-page-id file-exists?
  get-file-pages get-files get-files-blocks get-files-full get-journals-length
  get-latest-journals get-matched-blocks get-page get-page-alias get-page-alias-names get-page-blocks get-page-linked-refs-refed-pages
  get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format get-page-properties
  get-page-referenced-blocks get-page-referenced-pages get-page-unlinked-references get-page-referenced-blocks-no-cache
  get-all-pages get-pages get-pages-relation get-pages-that-mentioned-page get-public-pages get-tag-pages
  journal-page? local-native-fs? mark-repo-as-cloned! page-alias-set page-blocks-transform pull-block
  set-file-last-modified-at! transact-files-db! page-empty? page-empty-or-dummy? get-alias-source-page
  set-file-content! has-children? get-namespace-pages get-all-namespace-relation]

 [frontend.db.react
  get-current-marker get-current-page get-current-priority set-key-value
  transact-react! remove-key! remove-q! remove-query-component! add-q! add-query-component! clear-query-state!
  clear-query-state-without-refs-and-embeds! get-block-blocks-cache-atom get-page-blocks-cache-atom kv q
  query-state query-components query-entity-in-component remove-custom-query! set-new-result! sub-key-value refresh!]

 [frontend.db.query-custom
  custom-query]

 [frontend.db.query-react
  react-query custom-query-result-transform]

 [frontend.db.default built-in-pages-names built-in-pages])

;; persisting DBs between page reloads
(defn persist! [repo]
  (let [key (datascript-db repo)
        conn (get-conn repo false)]
    (when conn
      (let [db (d/db conn)
            db-str (if db (db->string db) "")]
        (p/let [_ (idb/set-batch! [{:key key :value db-str}])]
          (state/set-last-persist-transact-id! repo false (get-max-tx-id db)))))))

(defonce persistent-jobs (atom {}))

(defn clear-repo-persistent-job!
  [repo]
  (when-let [old-job (get @persistent-jobs repo)]
    (js/clearTimeout old-job)))

(defn- persist-if-idle!
  [repo]
  (clear-repo-persistent-job! repo)
  (let [job (js/setTimeout
             (fn []
               (if (and (state/input-idle? repo)
                        (state/db-idle? repo))
                 (do
                   (persist! repo)
                   ;; (state/set-db-persisted! repo true)
)
                 (persist-if-idle! repo)))
             3000)]
    (swap! persistent-jobs assoc repo job)))

;; only save when user's idle

;; TODO: pass as a parameter
(defonce *sync-search-indice-f (atom nil))
(defn- repo-listen-to-tx!
  [repo conn]
  (d/listen! conn :persistence
             (fn [tx-report]
               (when-not (util/electron?)
                 (let [tx-id (get-tx-id tx-report)]
                   (state/set-last-transact-time! repo (util/time-ms))
                   (persist-if-idle! repo)))

               ;; rebuild search indices
               (let [data (:tx-data tx-report)
                     datoms (filter
                             (fn [datom]
                               (contains? #{:block/name :block/content} (:a datom)))
                             data)]
                 (when-let [f @*sync-search-indice-f]
                   (f datoms))))))

(defn- listen-and-persist!
  [repo]
  (when-let [conn (get-conn repo false)]
    (repo-listen-to-tx! repo conn)))

(defn start-db-conn!
  ([me repo]
   (start-db-conn! me repo {}))
  ([me repo option]
   (conn/start! me repo
                (assoc option
                       :listen-handler listen-and-persist!))))

(defn restore!
  [{:keys [repos] :as me} old-db-schema restore-config-handler]
  (let [logged? (:name me)]
    (doall
     (for [{:keys [url]} repos]
       (let [repo url]
         (p/let [db-name (datascript-db repo)
                 db-conn (d/create-conn db-schema/schema)
                 _ (d/transact! db-conn [{:schema/version db-schema/version}])
                 _ (swap! conns assoc db-name db-conn)
                 stored (idb/get-item db-name)
                 _ (if stored
                     (let [stored-db (string->db stored)
                           attached-db (d/db-with stored-db (concat
                                                             [(me-tx stored-db me)]
                                                             default-db/built-in-pages))]
                       (conn/reset-conn! db-conn attached-db))
                     (when logged?
                       (d/transact! db-conn [(me-tx (d/db db-conn) me)])))]
           (restore-config-handler repo)
           (listen-and-persist! repo)))))))

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
