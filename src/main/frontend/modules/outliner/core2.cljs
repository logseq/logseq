(ns frontend.modules.outliner.core2
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]))

;;; Commentary
;;; properties related to block position:
;;; - :block/next: next node's :db/id
;;; - :block/level: node's indent level (>= 1)
;;; - :block/page: which page this node belong to


(defn- block-with-timestamps
  [block]
  (let [updated-at (util/time-ms)
        block (cond->
                  (assoc block :block/updated-at updated-at)
                  (nil? (:block/created-at block))
                  (assoc :block/created-at updated-at))]
    block))

(defn- remove-orphaned-page-refs!
  [db-id old-refs new-refs]
  (when (not= old-refs new-refs)
    (let [new-refs (set (map (fn [ref]
                               (or (:block/name ref)
                                   (and (:db/id ref)
                                        (:block/name (db/entity (:db/id ref)))))) new-refs))
          old-pages (->> (map :db/id old-refs)
                         (db-model/get-entities-by-ids)
                         (remove (fn [e] (contains? new-refs (:block/name e))))
                         (map :block/name)
                         (remove nil?))
          orphaned-pages (when (seq old-pages)
                           (db-model/get-orphaned-pages {:pages old-pages
                                                         :empty-ref-f (fn [page]
                                                                        (let [refs (:block/_refs page)]
                                                                          (or (zero? (count refs))
                                                                              (= #{db-id} (set (map :db/id refs))))))}))]
      (when (seq orphaned-pages)
        (mapv (fn [page] [:db/retractEntity (:db/id page)]) orphaned-pages)))))

(defn- ->map
  "convert Entity to map, but only includes keys in cache and :db/id"
  [node]
  (if (de/entity? node)
    (into {:db/id (:db/id node)} @(.-cache node))
    (into {} node)))

(defprotocol Node
  (-get-id [this])
  (-get-level [this])
  (-get-next [this])
  (-get-prev [this])
  (-set-next [this id-or-node])
  (-set-level [this level]))

(extend-protocol Node
  de/Entity
  (-get-id [this] (:db/id this))
  (-get-level [this] (:block/level this))
  (-get-next [this] (:block/next this))
  (-get-prev [this] (d/entity (conn/get-conn false) [:block/next (:db/id this)]))
  (-set-next [this id-or-node]
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc (->map this) :block/next)))
  (-set-level [this level] (assoc (->map this) :block/level level))

  PersistentHashMap
  (-get-id [this] (:db/id this))
  (-get-level [this] (:block/level this))
  (-get-next [this] (:block/next this))
  (-get-prev [this] (d/entity (conn/get-conn false) [:block/next (:db/id this)]))
  (-set-next [this id-or-node]
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc this :block/next)))
  (-set-level [this level] (assoc this :block/level level))

  PersistentTreeMap
  (-get-id [this] (:db/id this))
  (-get-level [this] (:block/level this))
  (-get-next [this] (:block/next this))
  (-get-prev [this] (d/entity (conn/get-conn false) [:block/next (:db/id this)]))
  (-set-next [this id-or-node]
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc this :block/next)))
  (-set-level [this level] (assoc this :block/level level))

  PersistentArrayMap
  (-get-id [this] (:db/id this))
  (-get-level [this] (:block/level this))
  (-get-next [this] (:block/next this))
  (-get-prev [this] (d/entity (conn/get-conn false) [:block/next (:db/id this)]))
  (-set-next [this id-or-node]
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc this :block/next)))
  (-set-level [this level] (assoc this :block/level level)))


(defn- save-aux [node]
  {:pre [(map? node)]}
  (let [txs (transient [])
        m (-> node
              (dissoc :block/children :block/meta :block/top? :block/bottom?
                      :block/title :block/body)
              (util/remove-nils))
        m (if (state/enable-block-timestamps?) (block-with-timestamps m) m)
        other-tx (:db/other-tx m)
        id (:db/id node)
        block-entity (db/entity id)
        old-refs (:block/refs block-entity)
        new-refs (:block/refs m)]
    (when (seq other-tx)
      (apply conj! txs other-tx))

    (when id
      (apply conj! (map (fn [attribute]
                          [:db/retract id attribute])
                        db-schema/retract-attributes))
      (when-let [e (:block/page block-entity)]
        (let [m {:db/id (:db/id e)
                 :block/updated-at (util/time-ms)}
              m (if (:block/created-at e)
                  m
                  (assoc m :block/created-at (util/time-ms)))]
          (conj! txs m))
        (apply conj! txs (remove-orphaned-page-refs! (:db/id block-entity) old-refs new-refs))))

    (conj! txs (dissoc m :db/other-tx))

    (persistent! txs)))

(defn- target-entity [id-or-entity]
  (if (or (instance? de/Entity id-or-entity) (map? id-or-entity))
    id-or-entity
    (db/entity id-or-entity)))


(defn- get-diff-level [node target-node sibling?]
  (let [origin-level (-get-level node)
        target-level (-get-level target-node)]
    (cond-> (- target-level origin-level) (not sibling?) inc)))




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; operations on outliner nodes ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn insert-nodes
  [nodes target-id-or-entity sibling?]
  {:pre [(seq nodes) (some? target-id-or-entity)]}
  (let [target (target-entity target-id-or-entity)
        next (-get-next target)
        first-node (first nodes)
        last-node (last nodes)
        diff-level (get-diff-level first-node target sibling?)
        update-level-txs
        (sequence
         (comp
          (map #(-set-level % (+ diff-level (:block/level %))))
          (map save-aux))
         nodes)
        update-next-id-txs
        [(-set-next target first-node)
         (-set-next last-node next)]]
    (vec (concat update-level-txs update-next-id-txs))))


(defn move-nodes
  [nodes target-id-or-entity sibling?]
  {:pre [(seq nodes) (some? target-id-or-entity)]}
  (let [target (target-entity target-id-or-entity)
        target-next (-get-next target)
        first-node (first nodes)
        origin-prev-first-node (-get-prev first-node)
        last-node (last nodes)
        origin-next-last-node (-get-next last-node)
        diff-level (get-diff-level first-node target sibling?)]
    (into
     ;; alter :block/next
     [(-set-next target first-node)
      (-set-next origin-prev-first-node origin-next-last-node)
      (-set-next last-node target-next)]
     ;; alter :block/level
     (map #(-set-level % (+ diff-level (:block/level %))) nodes))))


(defn delete-nodes
  [nodes]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        last-node (last nodes)
        target-node (-get-prev first-node)
        next-node (-get-next last-node)]
    (into
     ;; alter :block/next
     [(-set-next target-node next-node)]
     ;; retract nodes
     (map (fn [node] [:db/retractEntity (-get-id node)]) nodes))))


(defn indent-nodes
  [nodes]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        first-node-level (-get-level first-node)
        target-node (-get-prev first-node)
        target-level (-get-level target-node)]
    (when (>= target-level first-node-level)
      (map #(-set-level % (inc (-get-level %))) nodes))))

(defn outdent-nodes
  [nodes]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        first-node-level (-get-level first-node)]
    (when (> first-node-level 1)
      (map #(-set-level % (dec (-get-level %))) nodes))))
