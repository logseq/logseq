(ns frontend.db
  (:require [frontend.namespaces :refer-macros [import-vars]]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.model]
            [frontend.db.react]
            [frontend.db.query-custom]
            [frontend.util :as util]
            [datascript.core :as d]
            [frontend.state :as state]
            [promesa.core :as p]
            [frontend.db-schema :as db-schema]
            [clojure.core.async :as async]
            [frontend.idb :as idb]))

(import-vars
 [frontend.db.conn
  ;; TODO: remove later
  conns
  get-repo-path
  datascript-db
  datascript-files-db
  remove-db!
  remove-files-db!
  get-conn
  get-files-conn
  remove-conn!]

 [frontend.db.utils
  date->int db->json db->string get-max-tx-id get-tx-id
  group-by-page me-tx seq-flatten sort-by-pos
  string->db with-repo]

 [frontend.db.model
  entity pull pull-many
  add-properties! add-q! add-query-component! block-and-children-transform blocks-count blocks-count-cache clean-export! clear-query-state! clear-query-state-without-refs-and-embeds! cloned? delete-blocks delete-file! delete-file-blocks! delete-file-pages! delete-file-tx delete-files delete-pages-by-files filter-only-public-pages-and-blocks get-alias-page get-all-block-contents get-all-tagged-pages get-all-tags get-all-templates get-block-and-children get-block-and-children-no-cache get-block-blocks-cache-atom get-block-by-uuid get-block-children get-block-children-ids get-block-content get-block-file get-block-immediate-children get-block-page get-block-page-end-pos get-block-parent get-block-parents get-block-referenced-blocks get-block-refs-count get-blocks-by-priority get-blocks-contents get-collapsed-blocks get-config get-custom-css get-date-scheduled-or-deadlines get-db-type get-empty-pages get-file get-file-after-blocks get-file-after-blocks-meta get-file-blocks get-file-contents get-file-last-modified-at get-file-no-sub get-file-page get-file-page-id get-file-pages get-files get-files-blocks get-files-full get-files-that-referenced-page get-journals-length get-key-value get-latest-journals get-marker-blocks get-matched-blocks get-page get-page-alias get-page-alias-names get-page-blocks get-page-blocks-cache-atom get-page-blocks-count get-page-blocks-no-cache get-page-file get-page-format get-page-name get-page-properties get-page-properties-content get-page-referenced-blocks get-page-referenced-pages get-page-unlinked-references get-pages get-pages-relation get-pages-that-mentioned-page get-pages-with-modified-at get-public-pages get-tag-pages journal-page? kv local-native-fs? mark-repo-as-cloned! page-alias-set page-blocks-transform pull-block q query-components query-entity-in-component query-state rebuild-page-blocks-children remove-custom-query! remove-key! remove-q! remove-query-component! reset-config! set-file-last-modified-at! set-new-result! sub-key-value template-exists? transact! transact-files-db! with-block-refs-count with-dummy-block]

 [frontend.db.react
  get-current-marker get-current-page get-current-priority get-handler-keys set-file-content! set-key-value transact-react!]

 [frontend.db.query-custom
  custom-query custom-query-result-transform])

;; persisting DBs between page reloads
(defn persist! [repo]
  (let [file-key (datascript-files-db repo)
        non-file-key (datascript-db repo)
        file-db (d/db (get-files-conn repo))
        non-file-db (d/db (get-conn repo false))]
    (p/let [_ (idb/set-item! file-key (db->string file-db))
            _ (idb/set-item! non-file-key (db->string non-file-db))]
      (state/set-last-persist-transact-id! repo true (get-max-tx-id file-db))
      (state/set-last-persist-transact-id! repo false (get-max-tx-id non-file-db)))))

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
  [repo conn files-db?]
  (d/listen! conn :persistence
             (fn [tx-report]
               (let [tx-id (get-tx-id tx-report)]
                 (state/set-last-transact-time! repo (util/time-ms))
                 ;; (state/persist-transaction! repo files-db? tx-id (:tx-data tx-report))
                 (persist-if-idle! repo))

               ;; rebuild search indices
               (when-not files-db?
                 (let [data (:tx-data tx-report)
                       datoms (filter
                               (fn [datom]
                                 (contains? #{:page/name :block/content} (:a datom)))
                               data)]
                   (when-let [f @*sync-search-indice-f]
                     (f datoms)))))))

(defn- listen-and-persist!
  [repo]
  (when-let [conn (get-files-conn repo)]
    (repo-listen-to-tx! repo conn true))
  (when-let [conn (get-conn repo false)]
    (repo-listen-to-tx! repo conn false)))

(defn start-db-conn!
  ([me repo]
   (start-db-conn! me repo {}))
  ([me repo option]
   (conn/start! me repo
                (assoc option
                       :listen-handler listen-and-persist!))))

(defn restore!
  [{:keys [repos] :as me} restore-config-handler]
  (let [logged? (:name me)]
    (doall
     (for [{:keys [url]} repos]
       (let [repo url
             db-name (datascript-files-db repo)
             db-conn (d/create-conn db-schema/files-db-schema)]
         (swap! conns assoc db-name db-conn)
         (p/let [stored (idb/get-item db-name)
                 _ (when stored
                     (let [stored-db (string->db stored)
                           attached-db (d/db-with stored-db [(me-tx stored-db me)])]
                       (conn/reset-conn! db-conn attached-db)))
                 db-name (datascript-db repo)
                 db-conn (d/create-conn db-schema/schema)
                 _ (d/transact! db-conn [{:schema/version db-schema/version}])
                 _ (swap! conns assoc db-name db-conn)
                 stored (idb/get-item db-name)
                 _ (if stored
                     (let [stored-db (string->db stored)
                           attached-db (d/db-with stored-db [(me-tx stored-db me)])]
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
