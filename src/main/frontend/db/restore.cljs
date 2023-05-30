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
            [cljs-time.core :as t]
            [clojure.set :as set]
            [frontend.db.listener :as db-listener]
            [cognitect.transit :as transit]))

(def ^:private t-reader (transit/reader :json))

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

(defn- get-loading-data
  [repo *data per-length]
  (let [ks [repo :restore/unloaded-pages]
        {:keys [high-priority-pages unloaded-pages]} (get-in @state/state ks)]
    (loop [unloaded-pages (concat high-priority-pages unloaded-pages)
           result []]
      (if (or (>= (count result) per-length)
              (empty? unloaded-pages))
        result
        (let [[p & others] unloaded-pages
              items (get @*data p)
              result' (concat result items)]
          (swap! *data dissoc p)
          (state/update-state! ks (fn [m]
                                    (-> m
                                        (update :unloaded-pages disj p)
                                        (update :high-priority-pages (fn [items]
                                                                       (remove #{p} items))))))
          (state/update-state! [repo :restore/unloaded-blocks]
                               (fn [ids] (disj ids p)))
          (recur others result'))))))

(defn- replace-uuid-ref-with-eid
  [uuid->eid-map [e a v]]
  (if (and (contains? db-schema/ref-type-attributes a)
           (coll? v)
           (= :block/uuid (first v)))
    (if-let [eid (get uuid->eid-map (second v))]
      [e a eid]
      [e a v])
    [e a v]))

(defn- restore-other-data-from-sqlite!
  [repo data uuid->db-id-map]
  (let [start (util/time-ms)
        per-length 10000
        conn (db-conn/get-db repo false)
        *data (atom (group-by #(gobj/get % "page_uuid") data))
        unloaded-pages (keys @*data)
        unloaded-block-ids (set
                            (->> (map
                                  (fn [b] (gobj/get b "uuid"))
                                  data)
                                 (concat unloaded-pages)
                                 (remove nil?)))]
    (state/set-state! [repo :restore/unloaded-blocks] unloaded-block-ids)
    (state/set-state! [repo :restore/unloaded-pages :unloaded-pages] (set unloaded-pages))
    (p/loop [data (get-loading-data repo *data per-length)]
      (d/unlisten! conn :persistence)
      (cond
        (or (not= repo (state/get-current-repo)) ; switched to another graph
            (empty? data))
        (do
          (state/set-state! [repo :restore/unloaded-blocks] nil)
          (state/set-state! [repo :restore/unloaded-pages] nil)
          (db-listener/repo-listen-to-tx! repo conn)
          (let [end (util/time-ms)]
            (println "[debug] load others from SQLite: " (int (- end start)) " ms.")))

        (not (state/input-idle? repo {:diff 6000}))  ; wait until input is idle
        (p/do!
         (db-listener/repo-listen-to-tx! repo conn)
         (p/delay 5000)
         (p/recur (get-loading-data repo *data per-length)))

        :else
        (let [compf (comp
                     (partial apply d/datom)
                     uuid-str->uuid-in-eav-vec
                     (partial replace-uuid-ref-with-eid uuid->db-id-map))
              datoms (->> data
                          (mapv (fn [block]
                                  (let [uuid (gobj/get block "uuid")
                                        eid (get uuid->db-id-map uuid)]
                                    (assert eid (str "Can't find eid " eid ", block: " block))
                                    (->> (gobj/get block "datoms")
                                         (transit/read t-reader)
                                         (mapv
                                          (comp
                                           compf
                                           (partial apply vector eid)))))))
                          (apply concat))]
          (util/profile (str "DB transact! " (count datoms) " datoms") (d/transact! conn datoms {:skip-persist? true}))
          (state/update-state! [repo :restore/unloaded-blocks]
                               (fn [ids] (set/difference ids (set (map #(gobj/get % "uuid") data)))))
          (db-listener/repo-listen-to-tx! repo conn)
          (p/let [_ (p/delay 0)]
            (p/recur (get-loading-data repo *data per-length))))))))

(defn uuid-str->uuid-in-eav
  [[e a v]]
  [e a (if (= :block/uuid a) (uuid v) v)])

(defn- uuid-string?
  [s]
  (and (string? s)
       (= (count s) 36)
       (string/includes? s "-")))

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
                               (transit/read t-reader)
                               (mapv (partial apply vector eid)))))
                      all-pages)
          all-blocks' (doall
                       (keep (fn [b]
                               (let [eid (assign-id-to-uuid-fn (:uuid b))]
                                 (when (and (uuid-string? (:uuid b))
                                            (uuid-string? (:page_uuid b)))
                                   [[eid :block/uuid (:uuid b)]
                                    [eid :block/page [:block/uuid (:page_uuid b)]]])))
                             all-blocks))
          init-data' (doall
                      (keep (fn [b]
                              (let [eid (assign-id-to-uuid-fn (:uuid b))]
                                (if (uuid-string? (:uuid b)) ; deleted blocks still refed
                                  [[eid :block/uuid (uuid (:uuid b))]]
                                  (->> b
                                       :datoms
                                       (transit/read t-reader)
                                       (mapv (partial apply vector eid))))))
                            init-data))
          uuid->db-id-map (persistent! uuid->db-id-tmap)
          journal-blocks' (mapv
                           (fn [b]
                             (let [eid (get uuid->db-id-map (:uuid b))]
                               (->> b
                                    :datoms
                                    (transit/read t-reader)
                                    (mapv (partial apply vector eid)))))
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
         (restore-other-data-from-sqlite! repo other-data uuid->db-id-map)))
     200)))

(defn restore-graph!
  "Restore db from serialized db cache"
  [repo]
  (if (string/starts-with? repo config/db-version-prefix)
    (restore-graph-from-sqlite! repo)
    (p/let [db-name (db-conn/datascript-db repo)
            stored (db-persist/get-serialized-graph db-name)]
      (restore-graph-from-text! repo stored))))
