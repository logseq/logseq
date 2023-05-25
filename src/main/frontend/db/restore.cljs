(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [cljs-bean.core :as bean]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.conn :as db-conn]
            [frontend.db.migrate :as db-migrate]
            [frontend.db.persist :as db-persist]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.db.default :as default-db]
            [logseq.db.schema :as db-schema]
            [promesa.core :as p]
            [frontend.util :as util]
            [cljs-time.core :as t]))


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


(defn- restore-graph-from-text!
  "Swap db string into the current db status
   stored: the text to restore from"
  [repo stored]
  (p/let [db-name (db-conn/datascript-db repo)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! db-conn/conns assoc db-name db-conn)
          _ (when stored
              (let [stored-db (try (db-utils/string->db stored)
                                   (catch :default _e
                                     (js/console.warn "Invalid graph cache")
                                     (d/empty-db db-schema/schema)))
                    attached-db (d/db-with stored-db
                                           default-db/built-in-pages) ;; TODO bug overriding uuids?
                    db (if (old-schema? attached-db)
                         (db-migrate/migrate attached-db)
                         attached-db)]
                (db-conn/reset-conn! db-conn db)))]
    (d/transact! db-conn [{:schema/version db-schema/version}])))


(defn- uuid-str->uuid-in-eav-vec
  [[e a v]]
  (cond
    (and (= :block/uuid a) (string? v))
    [e a (uuid v)]

    (and (coll? v) (= 2 (count v))
         (= :block/uuid (first v))
         (string? (second v)))
    [e a [:block/uuid (uuid (second v))]]

    :else
    [e a v]))

(defn- restore-other-data-from-sqlite!
  [repo data]
  (let [per-length 2000
        conn (db-conn/get-db repo false)]
    (p/loop [data data]
      (cond
        (not= repo (state/get-current-repo)) ; switched to another graph
        nil

        (empty? data)
        nil

        (not (state/input-idle? repo {:diff 600000}))  ; wait until input is idle
        (p/do! (p/delay 5000)
               (p/recur data))

        :else
        (let [part (->> (take per-length data)
                        (map-indexed (fn [idx block]
                                       (->> (edn/read-string (gobj/get block "datoms"))
                                            (map
                                             (comp
                                              uuid-str->uuid-in-eav-vec
                                              (partial cons (dec (- idx)))))
                                            (sort-by #(if (= :block/uuid (second %)) 0 1)))))
                        (apply concat)
                        (map (fn [eav] (cons :db/add eav))))]
          (d/transact! conn part {:skip-persist? true})
          (p/let [_ (p/delay 200)]
            (p/recur (drop per-length data))))))))

(defn- replace-uuid-ref-with-eid
  [uuid->eid-map [e a v]]
  (if (and (contains? db-schema/ref-type-attributes a)
           (coll? v)
           (= :block/uuid (first v)))
    (if-let [eid (get uuid->eid-map (second v))]
      [e a eid]
      [e a v])
    [e a v]))

(defn uuid-str->uuid-in-eav
  [[e a v]]
  [e a (if (= :block/uuid a) (uuid v) v)])

(defn- restore-graph-from-sqlite!
  "Load initial data from SQLite"
  [repo]
  (p/let [start-time (t/now)
          data (ipc/ipc :get-initial-data repo)
          {:keys [all-pages all-blocks journal-blocks init-data]} (bean/->clj data)
          uuid->db-id-tmap (transient (hash-map))
          *next-db-id (atom 100001)
          assign-id-to-uuid-fn (fn [uuid-str]
                                 (let [id @*next-db-id]
                                   (conj! uuid->db-id-tmap [uuid-str id])
                                   (swap! *next-db-id inc)
                                   id))
          pages (mapv (fn [page]
                        (let [eid (assign-id-to-uuid-fn (:uuid page))]
                          (->> page
                               :datoms
                               edn/read-string
                               (map #(apply vector eid %)))))
                      all-pages)
          all-blocks' (doall
                       (keep (fn [b]
                               (let [eid (assign-id-to-uuid-fn (:uuid b))]
                                 (cond
                                   (and (util/uuid-string? (:uuid b))
                                        (util/uuid-string? (:page_uuid b)))
                                   [[eid :block/uuid (:uuid b)]
                                    [eid :block/page [:block/uuid (:page_uuid b)]]]

                                   ;; Source blocks have been deleted
                                   (util/uuid-string? (:uuid b))
                                   [[eid :block/uuid (uuid (:uuid b))]]

                                   :else
                                   nil)))
                             all-blocks))
          init-data' (doall
                      (keep (fn [b]
                              (let [eid (assign-id-to-uuid-fn (:uuid b))]
                                (if (util/uuid-string? (:uuid b)) ; deleted blocks still refed
                                  [[eid :block/uuid (uuid (:uuid b))]]
                                  (->> b
                                       :datoms
                                       edn/read-string
                                       (map #(apply vector eid %))))))
                            init-data))
          uuid->db-id-map (persistent! uuid->db-id-tmap)
          journal-blocks' (map (fn [b]
                                 (let [eid (get uuid->db-id-map (:uuid b))]
                                   (->> b
                                        :datoms
                                        edn/read-string
                                        (map #(apply vector eid %)))))
                               journal-blocks)
          sorted-pages-eav-coll (->> pages
                                     (apply concat)
                                     (sort-by (fn [eav] (if (= :block/uuid (second eav)) 0 1))))
          blocks-eav-colls (->> (concat all-blocks' journal-blocks' init-data')
                                (apply concat))
          all-eav-coll (doall (concat sorted-pages-eav-coll blocks-eav-colls))
          replaced-uuid-lookup-eav-coll (map
                                         (comp
                                          uuid-str->uuid-in-eav-vec
                                          (partial replace-uuid-ref-with-eid uuid->db-id-map))
                                         all-eav-coll)
          datoms (mapv #(apply d/datom %) replaced-uuid-lookup-eav-coll)
          ;; tx-data (map (partial cons :db/add) replaced-uuid-lookup-eav-coll)
          db-name (db-conn/datascript-db repo)
          db-conn (util/profile :restore-graph-from-sqlite!-init-db
                                (d/conn-from-datoms datoms db-schema/schema))
          _ (swap! db-conn/conns assoc db-name db-conn)
          end-time (t/now)]
    (println :restore-graph-from-sqlite!-prepare (t/in-millis (t/interval start-time end-time)) "ms")

    ;; (util/profile :restore-graph-from-sqlite!-transact (d/transact! db-conn tx-data))

    ;; TODO: Store schema in sqlite
    ;; (db-migrate/migrate attached-db)

    (d/transact! db-conn [(react/kv :db/type "db")
                          {:schema/version db-schema/version}]
                 {:skip-persist? true})

    (js/setTimeout
     (fn []
       (p/let [other-data (ipc/ipc :get-other-data repo (map :uuid journal-blocks))]
         (restore-other-data-from-sqlite! repo other-data)))
     1000)))

(defn restore-graph!
  "Restore db from serialized db cache"
  [repo]
  (if (string/starts-with? repo config/db-version-prefix)
    (restore-graph-from-sqlite! repo)
    (p/let [db-name (db-conn/datascript-db repo)
            stored (db-persist/get-serialized-graph db-name)]
      (restore-graph-from-text! repo stored))))
