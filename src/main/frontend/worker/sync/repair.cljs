(ns frontend.worker.sync.repair
  "Builds and applies db-sync repair transactions for missing block data.

  Repair transactions are used only after the server reports missing blocks or
  when applying remote txs needs server-provided block data."
  (:require [datascript.core :as d]
            [logseq.db :as ldb]
            [frontend.worker.sync.const :as sync-const]
            [frontend.worker.sync.crypt :as sync-crypt]
            [promesa.core :as p]))

(def upload-repair-created-at 0)

(defn sync-fix-tx-meta
  []
  {:outliner-op :fix
   :db-sync/tx-id (random-uuid)})

(defn- ref-attr?
  [db attr]
  (= :db.type/ref (get-in (d/schema db) [attr :db/valueType])))

(defn- ref-value
  [db attr v]
  (if-let [entity (and (ref-attr? db attr)
                       (number? v)
                       (d/entity db v))]
    (if-let [block-uuid (:block/uuid entity)]
      [:block/uuid block-uuid]
      (or (:db/ident entity) v))
    v))

(defn- many-attr?
  [db attr]
  (= :db.cardinality/many (get-in (d/schema db) [attr :db/cardinality])))

(defn- assoc-repair-attr
  [db m attr value]
  (let [value' (ref-value db attr value)]
    (if (many-attr? db attr)
      (update m attr (fnil conj #{}) value')
      (assoc m attr value'))))

(defn- local-repair-block-map
  [db block-uuid]
  (when-let [eid (d/entid db [:block/uuid block-uuid])]
    (let [datoms (d/datoms db :eavt eid)]
      (reduce (fn [m datom]
                (assoc-repair-attr db m (:a datom) (:v datom)))
              {}
              datoms))))

(defn local-repair-tx-data
  [db block-uuids]
  (->> block-uuids
       distinct
       (keep (partial local-repair-block-map db))
       vec))

(defn- <decrypt-map-entry
  [aes-key [attr value]]
  (if (contains? sync-const/encrypt-attr-set attr)
    (p/let [value' (sync-crypt/<decrypt-text-value aes-key value)]
      [attr value'])
    (p/resolved [attr value])))

(defn- <decrypt-item
  [aes-key item]
  (if (map? item)
    (p/let [entries (p/all (mapv (partial <decrypt-map-entry aes-key) item))]
      (into {} entries))
    (p/let [[item'] (sync-crypt/<decrypt-tx-data aes-key [item])]
      item')))

(defn <decrypt-tx-data
  [aes-key tx-data]
  (p/all (mapv (partial <decrypt-item aes-key) tx-data)))

(defn- repair-map-block-uuid
  [item]
  (when (map? item)
    (:block/uuid item)))

(defn- repair-temp-id
  [block-uuid]
  (str "repair-block-" block-uuid))

(defn- repair-ref->temp-id
  [uuid->temp-id v]
  (cond
    (and (vector? v)
         (= :block/uuid (first v))
         (contains? uuid->temp-id (second v)))
    (get uuid->temp-id (second v))

    (map? v)
    (update-vals v (partial repair-ref->temp-id uuid->temp-id))

    (vector? v)
    (mapv (partial repair-ref->temp-id uuid->temp-id) v)

    (set? v)
    (set (map (partial repair-ref->temp-id uuid->temp-id) v))

    (seq? v)
    (doall (map (partial repair-ref->temp-id uuid->temp-id) v))

    :else
    v))

(defn- with-repair-temp-ids
  [tx-data]
  (let [uuid->temp-id (->> tx-data
                           (keep repair-map-block-uuid)
                           distinct
                           (map (juxt identity repair-temp-id))
                           (into {}))]
    (mapv (fn [item]
            (let [item' (repair-ref->temp-id uuid->temp-id item)]
              (if-let [block-uuid (repair-map-block-uuid item)]
                (assoc item' :db/id (repair-temp-id block-uuid))
                item')))
          tx-data)))

(defn apply-tx-data!
  [conn tx-data]
  (when (seq tx-data)
    (ldb/transact! conn (with-repair-temp-ids tx-data) (sync-fix-tx-meta))))
