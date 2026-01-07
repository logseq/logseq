(ns logseq.worker-sync.cycle
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]))

(def special-attrs
  #{:block/parent
    :logseq.property.class/extends})

(defn- ref->eid [db ref]
  (cond
    (nil? ref) nil
    (number? ref) ref
    (vector? ref) (d/entid db ref)
    (instance? Entity ref) (.-eid ^Entity ref)
    (uuid? ref) (d/entid db [:block/uuid ref])
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

(defn- next-parent-eid [db attr eid]
  (when-let [entity (d/entity db eid)]
    (let [value (get entity attr)]
      (ref->eid db value))))

(defn- cycle-from-eid? [db attr eid]
  (loop [seen #{eid}
         current (next-parent-eid db attr eid)]
    (cond
      (nil? current) false
      (contains? seen current) true
      :else (recur (conj seen current) (next-parent-eid db attr current)))))

(defn detect-cycle
  "Returns a map with cycle details when applying tx-data would introduce a cycle.
  Otherwise returns nil."
  [db tx-data]
  (let [db' (d/db-with db tx-data)]
    (reduce
     (fn [_ attr]
       (let [updates (attr-updates-from-tx tx-data attr)]
         (let [result
               (reduce
                (fn [_ {:keys [entity value]}]
                  (if (nil? value)
                    nil
                    (let [entity-ref (normalize-entity-ref entity)
                          eid (ref->eid db' entity-ref)]
                      (when (and eid (cycle-from-eid? db' attr eid))
                        {:attr attr
                         :entity entity-ref}))))
                nil
                updates)]
           (when result
             (reduced result)))))
     nil
     special-attrs)))

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
         (assoc acc (pr-str entity-ref) current)))
     {}
     updates)))
