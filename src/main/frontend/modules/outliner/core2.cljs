(ns frontend.modules.outliner.core2
  (:require [datascript.impl.entity :as de]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]))

;;; Commentary
;;; properties related to block position:
;;; - :block/next: next node's :db/id
;;; - :block/level: node's indent level (>= 1)
;;; - :block/page: which page this node belongs to


(defn- block-with-timestamps
  [block]
  (let [updated-at (util/time-ms)
        block (cond->
                  (assoc block :block/updated-at updated-at)
                  (nil? (:block/created-at block))
                  (assoc :block/created-at updated-at))]
    block))

(defn- remove-orphaned-page-refs!
  [db db-id old-refs new-refs]
  (when (not= old-refs new-refs)
    (let [new-refs (set (map (fn [ref]
                               (or (:block/name ref)
                                   (and (:db/id ref)
                                        (:block/name (d/entity db (:db/id ref)))))) new-refs))
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

(defn- id-map
  [node]
  {:db/id (:db/id node)})

(defprotocol Node
  (-get-id [this] "return :db/id or nil")
  (-get-level [this] "return :block/level or nil")
  (-get-next [this db] "return next entity or nil")
  (-get-prev [this db] "return prev entity or nil")
  (-unset-next [this] "transaction to remove :block/next attr")
  (-set-next [this id-or-node] "transaction to add :block/next attr")
  (-set-level [this level] "transaction to add :block/level attr"))

(defn- map-get-id [this] (:db/id this))
(defn- map-get-level [this] (:block/level this))
(defn- map-get-next [this db] (d/entity db (:db/id (:block/next this))))
(defn- map-get-prev [this db] (d/entity db [:block/next (:db/id this)]))
(defn- map-unset-next [this] [:db.fn/retractAttribute (:db/id this) :block/next])
(defn- map-set-next [this id-or-node]
  (when id-or-node
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc (id-map this) :block/next))))
(defn- map-set-level [this level] (assoc (id-map this) :block/level level))

(extend-protocol Node
  de/Entity
  (-get-id [this] (:db/id this))
  (-get-level [this] (:block/level this))
  (-get-next [this _] (:block/next this))
  (-get-prev [this db] (d/entity db [:block/next (:db/id this)]))
  (-unset-next [this] [:db.fn/retractAttribute (:db/id this) :block/next])
  (-set-next [this id-or-node]
    (when id-or-node
      (cond->> id-or-node
        (not (number? id-or-node)) :db/id
        true (assoc (id-map this) :block/next))))
  (-set-level [this level] (assoc (id-map this) :block/level level))

  PersistentHashMap
  (-get-id [this] (map-get-id this))
  (-get-level [this] (map-get-level this))
  (-get-next [this db] (map-get-next this db))
  (-get-prev [this db] (map-get-prev this db))
  (-unset-next [this] (map-unset-next this))
  (-set-next [this id-or-node] (map-set-next this id-or-node))
  (-set-level [this level] (map-set-level this level))

  PersistentTreeMap
  (-get-id [this] (map-get-id this))
  (-get-level [this] (map-get-level this))
  (-get-next [this db] (map-get-next this db))
  (-get-prev [this db] (map-get-prev this db))
  (-unset-next [this] (map-unset-next this))
  (-set-next [this id-or-node] (map-set-next this id-or-node))
  (-set-level [this level] (map-set-level this level))

  PersistentArrayMap
  (-get-id [this] (map-get-id this))
  (-get-level [this] (map-get-level this))
  (-get-next [this db] (map-get-next this db))
  (-get-prev [this db] (map-get-prev this db))
  (-unset-next [this] (map-unset-next this))
  (-set-next [this id-or-node] (map-set-next this id-or-node))
  (-set-level [this level] (map-set-level this level)))


(defn- save-aux
  "Generate datascript transaction data,
  call this function when node's fields(except :block/next & :block/level) changes."
  [db node]
  {:pre [(map? node)]}
  (let [txs (transient [])
        m (-> node
              (dissoc :block/children :block/meta :block/top? :block/bottom?
                      :block/title :block/body)
              (util/remove-nils))
        m (if (state/enable-block-timestamps?) (block-with-timestamps m) m)
        other-tx (:db/other-tx m)
        id (:db/id node)
        block-entity (if (> id 0) (d/entity db id) nil)
        old-refs (:block/refs block-entity)
        new-refs (:block/refs m)]
    (when (seq other-tx)
      (apply conj! txs other-tx))

    (when (> id 0)
      (apply conj! txs (map (fn [attribute]
                              [:db/retract id attribute])
                            db-schema/retract-attributes))
      (when-let [e (:block/page block-entity)]
        (let [m {:db/id (:db/id e)
                 :block/updated-at (util/time-ms)}
              m (if (:block/created-at e)
                  m
                  (assoc m :block/created-at (util/time-ms)))]
          (conj! txs m))
        (apply conj! txs (remove-orphaned-page-refs! db (:db/id block-entity) old-refs new-refs))))

    (conj! txs (dissoc m :db/other-tx))

    (persistent! txs)))

(defn- target-entity [id-or-entity db]
  (if (or (instance? de/Entity id-or-entity) (map? id-or-entity))
    id-or-entity
    (d/entity db id-or-entity)))


(defn- get-diff-level [node target-node sibling?]
  (let [origin-level (-get-level node)
        target-level (-get-level target-node)]
    (cond-> (- target-level origin-level) (not sibling?) inc)))

(defn- assign-temp-id
  [nodes]
  (map-indexed (fn [idx node]
                 (if (-get-id node)
                   node
                   (assoc node :db/id (dec (- idx))))) nodes))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; operations on outliner nodes ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn insert-nodes
  "TODO: check nodes are map list"
  [nodes db target-id-or-entity sibling?]
  {:pre [(seq nodes) (some? target-id-or-entity)]}
  (let [nodes (assign-temp-id nodes)
        target (target-entity target-id-or-entity db)
        next (-get-next target db)
        first-node (first nodes)
        last-node (last nodes)
        diff-level (get-diff-level first-node target sibling?)
        update-level-txs
        (sequence
         (comp
          (map #(merge % (-set-level % (+ diff-level (:block/level %)))))
          (map #(save-aux db %))
          cat)
         nodes)
        update-next-id-txs
        [(-set-next target first-node)
         (-set-next last-node next)]
        update-internal-nodes-next-id-txs
        (for [i (range)
              :let [n1 (nth nodes i nil)
                    n2 (nth nodes (inc i) nil)]
              :while (and n1 n2)]
          (-set-next n1 n2))]
    (vec (concat update-level-txs update-next-id-txs update-internal-nodes-next-id-txs))))


(defn move-nodes
  [nodes db target-id-or-entity sibling?]
  {:pre [(seq nodes) (some? target-id-or-entity)]}
  (let [target (target-entity target-id-or-entity db)
        target-next (-get-next target db)
        first-node (first nodes)
        origin-prev-first-node (-get-prev first-node db)
        last-node (last nodes)
        origin-next-last-node (-get-next last-node db)
        diff-level (get-diff-level first-node target sibling?)]
    (into
     ;; alter :block/next
     [(-unset-next origin-prev-first-node)
      (-set-next target first-node)
      (-set-next last-node target-next)
      (-set-next origin-prev-first-node origin-next-last-node)]
     ;; alter :block/level
     (map #(-set-level % (+ diff-level (:block/level %))) nodes))))


(defn delete-nodes
  [nodes db]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        last-node (last nodes)
        target-node (-get-prev first-node db)
        next-node (-get-next last-node db)]
    (conj
     ;; retract nodes
     (mapv (fn [node] [:db/retractEntity (-get-id node)]) nodes)
     ;; alter :block/next
     (-set-next target-node next-node))))


(defn indent-nodes
  "indent consecutive sorted nodes"
  [nodes db]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        first-node-level (-get-level first-node)
        target-node (-get-prev first-node db)
        target-level (-get-level target-node)]
    (when (>= target-level first-node-level)
      (map #(-set-level % (inc (-get-level %))) nodes))))

(defn outdent-nodes
  "outdent consecutive sorted nodes"
  [nodes db]
  {:pre [(seq nodes)]}
  (let [last-node (last nodes)
        last-node-level (-get-level last-node)
        next-last-node (-get-next last-node db)
        next-last-node-level (-get-level next-last-node)]
    (when (and (<= next-last-node-level last-node-level)
                                        ;every node's level >= 1
               (not-any? #(<= (-get-level %) 1) nodes))
      (map #(-set-level % (dec (-get-level %))) nodes))))


(defn get-children-nodes
  "return sorted nodes: NODE itself and its children"
  [node db]
  (let [node-level (-get-level node)
        nodes (transient [node])]
    (loop [next-node (-get-next node db)]
      (when (and next-node (> (-get-level next-node) node-level))
        (conj! nodes next-node)
        (recur (-get-next next-node db))))
    (persistent! nodes)))

(defn get-page-nodes
  "return PAGE-NODE's sorted nodes"
  [page-node db]
  (let [nodes (transient [])]
    (loop [next-node (-get-next page-node db)]
      (when next-node
        (conj! nodes next-node)
        (recur (-get-next next-node db))))
    (persistent! nodes)))
