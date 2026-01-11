(ns logseq.db-sync.cycle
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]))

(def special-attrs
  #{:block/parent
    :logseq.property.class/extends})

(defn- ref->eid [db ref]
  (cond
    (nil? ref) nil
    (number? ref) (when (pos? ref) ref)
    (vector? ref) (d/entid db ref)
    (keyword? ref) (d/entid db [:db/ident ref])
    :else nil))

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
                        (:db/ident tx))
             value (get tx attr)]
         (if (some? entity)
           (conj acc {:entity entity
                      :value value})
           acc))

       :else acc))
   []
   tx-data))

(defn- normalize-entity-ref [entity]
  (cond
    (vector? entity) entity
    (uuid? entity) [:block/uuid entity]
    (keyword? entity) [:db/ident entity]
    :else entity))

(defn- next-parent-eid [db attr eid updates-by-eid]
  (if (contains? updates-by-eid eid)
    (get updates-by-eid eid)
    (when-let [entity (d/entity db eid)]
      (let [value (get entity attr)]
        (cond
          (instance? Entity value) (:db/id value)
          :else (ref->eid db (normalize-entity-ref value)))))))

(defn- cycle-from-eid? [db attr start-eid target-eid updates-by-eid]
  (loop [seen #{target-eid}
         current start-eid]
    (cond
      (nil? current) false
      (contains? seen current) true
      :else (recur (conj seen current)
                   (next-parent-eid db attr current updates-by-eid)))))

(defn- normalize-entity-ref-for-result [db entity-ref]
  (if (number? entity-ref)
    (when-let [ent (d/entity db entity-ref)]
      [:block/uuid (:block/uuid ent)])
    entity-ref))

(defn detect-cycle
  "Returns a map with cycle details when applying tx-data would introduce a cycle.
  Otherwise returns nil."
  [db tx-data]
  (reduce
   (fn [_ attr]
     (let [updates (attr-updates-from-tx tx-data attr)
           updates-by-eid
           (reduce
            (fn [acc {:keys [entity value]}]
              (let [entity-ref (normalize-entity-ref entity)
                    eid (ref->eid db entity-ref)
                    value-ref (normalize-entity-ref value)
                    value-eid (ref->eid db value-ref)]
                (if eid
                  (assoc acc eid value-eid)
                  acc)))
            {}
            updates)
           result
           (reduce
            (fn [_ {:keys [entity value]}]
              (if (nil? value)
                nil
                (let [entity-ref (normalize-entity-ref entity)
                      eid (ref->eid db entity-ref)
                      value-ref (normalize-entity-ref value)
                      value-eid (ref->eid db value-ref)]
                  (when (and eid value-eid
                             (cycle-from-eid? db attr value-eid eid updates-by-eid))
                    {:attr attr
                     :entity (normalize-entity-ref-for-result db entity-ref)}))))
            nil
            updates)]
       (when result
         (reduced result))))
   nil
   special-attrs))

(defn server-values-for
  "Returns a map of entity refs to the server's current value for attr."
  [db tx-data attr]
  (let [updates (attr-updates-from-tx tx-data attr)]
    (reduce
     (fn [acc {:keys [entity]}]
       (let [entity-ref (normalize-entity-ref entity)
             eid (ref->eid db entity-ref)
             current-raw (when eid (get (d/entity db eid) attr))
             current (cond
                       (nil? current-raw) nil
                       (= attr :logseq.property.class/extends)
                       (if (instance? Entity current-raw)
                         (:db/ident current-raw)
                         current-raw)
                       (= attr :block/parent)
                       (let [parent-uuid (cond
                                           (instance? Entity current-raw) (:block/uuid current-raw)
                                           (number? current-raw) (:block/uuid (d/entity db current-raw))
                                           :else nil)]
                         (when parent-uuid
                           [:block/uuid parent-uuid]))
                       :else current-raw)]
         (assoc acc [:block/uuid (:block/uuid (d/entity db eid))] current)))
     {}
     updates)))
