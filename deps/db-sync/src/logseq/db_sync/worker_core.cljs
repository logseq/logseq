(ns logseq.db-sync.worker-core
  (:require [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.common.order :as db-order]
            [logseq.db-sync.common :as common]))

(defn- journal-page-info []
  (let [now (common/now-ms)
        day (date-time/ms->journal-day now)
        formatter (common-config/get-date-formatter nil)
        title (date-time/int->journal-title day formatter)
        page-uuid (common-uuid/gen-uuid :journal-page-uuid day)]
    {:day day
     :title title
     :name (common-util/page-name-sanity-lc title)
     :uuid page-uuid}))

(defn- build-journal-page-tx [db {:keys [day title name uuid]}]
  (when (and uuid title name (nil? (d/entity db [:block/uuid uuid])))
    [{:block/uuid uuid
      :block/title title
      :block/name name
      :block/journal-day day
      :block/tags #{:logseq.class/Journal}
      :block/created-at (common/now-ms)
      :block/updated-at (common/now-ms)}]))

(defn- max-order-for-parent [db parent-eid]
  (reduce
   (fn [acc datom]
     (let [order (:block/order (d/entity db (:e datom)))]
       (if (and order (or (nil? acc) (pos? (compare order acc))))
         order
         acc)))
   nil
   (d/datoms db :avet :block/parent parent-eid)))

(defn- attr-updates-from-tx [tx-data attr]
  (reduce
   (fn [acc tx]
     (cond
       (and (vector? tx)
            (= :db/add (first tx))
            (= attr (nth tx 2)))
       (conj acc {:entity (nth tx 1)
                  :value (nth tx 3)})

       (and (map? tx) (contains? tx attr))
       (let [entity (or (:db/id tx)
                        (:block/uuid tx)
                        (:db/ident tx))]
         (if (some? entity)
           (conj acc {:entity entity
                      :value (get tx attr)})
           acc))

       :else acc))
   []
   tx-data))

(defn- safe-entid [db ref]
  (try
    (when-let [ent (d/entity db ref)]
      (:db/id ent))
    (catch :default _
      nil)))

(defn fix-missing-parent [db tx-data]
  (let [db' (d/db-with db tx-data)
        updates (attr-updates-from-tx tx-data :block/parent)
        journal (journal-page-info)
        journal-ref [:block/uuid (:uuid journal)]
        journal-tx (build-journal-page-tx db' journal)
        db'' (if (seq journal-tx) (d/db-with db' journal-tx) db')
        parent-eid (d/entid db'' journal-ref)
        max-order (when parent-eid (max-order-for-parent db'' parent-eid))
        max-atom (atom max-order)
        fixes (reduce
               (fn [acc {:keys [entity value]}]
                 (let [entity-ref entity
                       parent-ref value
                       eid (safe-entid db'' entity-ref)
                       parent-eid' (when parent-ref (safe-entid db'' parent-ref))]
                   (if (and eid (some? value) (nil? parent-eid'))
                     (let [order (db-order/gen-key @max-atom nil :max-key-atom max-atom)]
                       (conj acc
                             [:db/add entity-ref :block/parent journal-ref]
                             [:db/add entity-ref :block/page journal-ref]
                             [:db/add entity-ref :block/order order]))
                     acc)))
               []
               updates)]
    (cond-> tx-data
      (seq journal-tx) (into journal-tx)
      (seq fixes) (into fixes))))

(defn fix-duplicate-orders [db tx-data]
  (let [db' (d/db-with db tx-data)
        updates (attr-updates-from-tx tx-data :block/order)
        max-order-atoms (atom {})
        fixes (reduce
               (fn [acc {:keys [entity value]}]
                 (let [entity-ref entity
                       eid (safe-entid db' entity-ref)
                       parent (when eid (:block/parent (d/entity db' eid)))
                       parent-eid (when parent (safe-entid db' parent))]
                   (if (and eid parent-eid value)
                     (let [siblings (d/datoms db' :avet :block/parent parent-eid)
                           same-order? (some
                                        (fn [datom]
                                          (let [sib-eid (:e datom)]
                                            (and (not= sib-eid eid)
                                                 (= value (:block/order (d/entity db' sib-eid))))))
                                        siblings)]
                       (if same-order?
                         (let [max-atom (or (get @max-order-atoms parent-eid)
                                            (let [max-order (max-order-for-parent db' parent-eid)
                                                  created (atom max-order)]
                                              (swap! max-order-atoms assoc parent-eid created)
                                              created))
                               order (db-order/gen-key @max-atom nil :max-key-atom max-atom)]
                           (conj acc [:db/add entity-ref :block/order order]))
                         acc))
                     acc)))
               []
               updates)]
    (if (seq fixes)
      (into tx-data fixes)
      tx-data)))
