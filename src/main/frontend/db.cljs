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
            [electron.ipc :as ipc]
            [clojure.string :as string]
            [frontend.config :as config]
            [clojure.edn :as edn]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]))

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
  blocks-count blocks-count-cache delete-blocks get-pre-block
  delete-files delete-pages-by-files get-all-block-contents get-all-tagged-pages
  get-all-templates get-block-and-children get-block-by-uuid get-block-children sort-by-left
  get-block-parent get-block-parents parents-collapsed? get-block-referenced-blocks get-all-referenced-blocks-uuid
  get-block-children-ids get-block-immediate-children get-block-page
  get-custom-css get-date-scheduled-or-deadlines
  get-file-last-modified-at get-file get-file-page get-file-page-id file-exists?
  get-files get-files-blocks get-files-full get-journals-length get-pages-with-file
  get-latest-journals get-page get-page-alias get-page-alias-names get-paginated-blocks
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
  clear-query-state-without-refs-and-embeds! kv q
  query-state query-components remove-custom-query! set-new-result! sub-key-value refresh!]

 [frontend.db.query-custom
  custom-query]

 [frontend.db.query-react
  react-query custom-query-result-transform]

 [logseq.db.default built-in-pages-names built-in-pages])

(defn- old-schema?
  "Requires migration if the schema version is older than db-schema/version"
  [db]
  (let [v (db-migrate/get-schema-version db)
        ;; backward compatibility
        v (if (integer? v) v 0)]
    (cond
      (= db-schema/version v)
      false

      (< db-schema/version v)
      (do
        (js/console.error "DB schema version is newer than the app, please update the app. " ":db-version" v)
        false)

      :else
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
                        (state/db-idle? repo)
                        ;; It's ok to not persist here since new changes
                        ;; will be notified when restarting the app.
                        (not (state/whiteboard-route?)))
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

(defn- uuid-str->uuid-in-av-vec
  [[a v]]
  (cond
    (and (= :block/uuid a) (string? v))
    [a (uuid v)]

    (and (coll? v) (= 2 (count v))
         (= :block/uuid (first v))
         (string? (second v)))
    [a [:block/uuid (uuid (second v))]]

    :else
    [a v]))

(defn- add-tempid-to-av-colls
  [start-tempid av-colls]
  (map-indexed (fn [idx av-coll]
                 (map (partial cons (dec (- start-tempid idx))) av-coll))
               av-colls))

(defn restore-other-data-from-sqlite!
  [repo data]
  (let [per-length 2000]
    (p/loop [data data]
      (cond
        (not= repo (state/get-current-repo)) ; switched to another graph
        nil

        (empty? data)
        nil

        (not (state/input-idle? repo))  ; wait until input is idle
        (js/setTimeout #(restore-other-data-from-sqlite! repo data) 5000)

        :else
        (let [part (->> (take per-length data)
                        (map (fn [block]
                               (map uuid-str->uuid-in-av-vec
                                    (edn/read-string (gobj/get block "datoms")))))
                        (map-indexed (fn [idx av-coll]
                                       (->> av-coll
                                            (map (partial cons (dec (- idx))))
                                            (sort-by #(if (= :block/uuid (second %)) 0 1)))))
                        (apply concat)
                        (map (fn [eav] (cons :db/add eav))))]
          (transact! repo part {:skip-persist? true})
          (p/let [_ (p/delay 200)]
            (p/recur (drop per-length data)))
          )))))

(defn restore-graph-from-sqlite!
  "Load initial data from SQLite"
  [repo]
  (p/let [db-name (datascript-db repo)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! conns assoc db-name db-conn)
          data (ipc/ipc :get-initial-data repo)
          {:keys [all-pages all-blocks journal-blocks]} (bean/->clj data)
          pages (map (fn [page]
                       (->> page
                            :datoms
                            edn/read-string
                            (map uuid-str->uuid-in-av-vec)))
                     all-pages)
          all-blocks' (map (fn [b]
                             [[:block/uuid (uuid (:uuid b))]
                              [:block/page [:block/uuid (uuid (:page_uuid b))]]])
                           all-blocks)
          journal-blocks' (map (fn [b]
                                 (->> b
                                      :datoms
                                      edn/read-string
                                      (map uuid-str->uuid-in-av-vec)))
                               journal-blocks)
          pages-eav-colls (add-tempid-to-av-colls 0 pages)
          pages-eav-coll (->> pages-eav-colls
                              (apply concat)
                              (sort-by (fn [eav] (if (= :block/uuid (second eav)) 0 1))))
          blocks-eav-colls (->> (concat all-blocks' journal-blocks')
                                (add-tempid-to-av-colls (- (count pages-eav-colls)))
                                (apply concat))
          tx-data (map (partial cons :db/add) (concat pages-eav-coll blocks-eav-colls))]
    (def xx [all-pages all-blocks journal-blocks tx-data])
    (d/transact! db-conn tx-data)

    ;; TODO: Store schema in sqlite
    ;; (db-migrate/migrate attached-db)

    (d/transact! db-conn [(react/kv :db/type "db")
                          {:schema/version db-schema/version}]
                 {:skip-persist? true})
    (println :restore-graph-from-sqlite! :done)

    (js/setTimeout
     (fn []
       (p/let [other-data (ipc/ipc :get-other-data repo (map :uuid journal-blocks))]
         (restore-other-data-from-sqlite! repo other-data)))
     1000)
    ))

(defn restore-graph!
  "Restore db from serialized db cache"
  [repo]
  (if (string/starts-with? repo config/db-version-prefix)
    (restore-graph-from-sqlite! repo)
    (p/let [db-name (datascript-db repo)
           stored (db-persist/get-serialized-graph db-name)]
     (restore-graph-from-text! repo stored))))

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
