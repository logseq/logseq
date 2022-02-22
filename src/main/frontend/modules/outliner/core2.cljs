(ns frontend.modules.outliner.core2
  (:require [datascript.impl.entity :as de]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.modules.outliner.transaction]
            [cljs.spec.alpha :as s]))

;;; Commentary
;; properties related to block position:
;; - :block/next: next node's :db/id
;; - :block/level: node's indent level (>= 1)
;; - :block/page: which page this node belongs to

;;; utils
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

(declare get-level get-next)
(defn- skip-children
  "get the last child node of NODE, or NODE itself when no child"
  [node db]
  (let [level (get-level node)]
    (loop [node node]
      (if-let [next-node (get-next node db)]
        (let [next-node-level (get-level next-node)]
          (if (> next-node-level level)
            (recur next-node)
            node))
        node))))


;;; Node apis
(defprotocol Node
  (-get-id [this] "return :db/id or nil")
  (-get-level [this] "return :block/level or nil")
  (-get-next [this db] "return next entity or nil")
  (-get-prev [this db] "return prev entity or nil")
  (-unset-next [this] "transaction to remove :block/next attr")
  (-set-next [this id-or-node] "transaction to add :block/next attr")
  (-set-level [this level] "transaction to add :block/level attr"))


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
  (-set-level [this level] (assoc (id-map this) :block/level level)))

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

(defn get-id [o]
  (cond
    (implements? Node o)
    (-get-id o)

    (map? o)
    (map-get-id o)

    :else
    (throw (js/Error. (str "cannot get-id on " o)))))

(defn get-level [o]
  (cond
    (implements? Node o)
    (-get-level o)

    (map? o)
    (map-get-level o)

    :else
    (throw (js/Error. (str "cannot get-level on " o)))))

(defn get-next [o db]
  (cond
    (implements? Node o)
    (-get-next o db)

    (map? o)
    (map-get-next o db)

    :else
    (throw (js/Error. (str "cannot get-next on " o)))))

(defn get-prev [o db]
  (cond
    (implements? Node o)
    (-get-prev o db)

    (map? o)
    (map-get-prev o db)

    :else
    (throw (js/Error. (str "cannot get-prev on " o)))))

(defn unset-next [o]
  (cond
    (implements? Node o)
    (-unset-next o)

    (map? o)
    (map-unset-next o)

    :else
    (throw (js/Error. (str "cannot unset-next on " o)))))

(defn set-next [o id-or-node]
  (cond
    (implements? Node o)
    (-set-next o id-or-node)

    (map? o)
    (map-set-next o id-or-node)

    :else
    (throw (js/Error. (str "cannot set-next on " o)))))

(defn set-level [o level]
  (cond
    (implements? Node o)
    (-set-level o level)

    (map? o)
    (map-set-level o level)

    :else
    (throw (js/Error. (str "cannot set-level on " o)))))
;;; node apis ends here

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
  (let [origin-level (get-level node)
        target-level (get-level target-node)]
    (cond-> (- target-level origin-level) (not sibling?) inc)))

(defn- assign-temp-id
  [nodes]
  (map-indexed (fn [idx node]
                 (if (get-id node)
                   node
                   (assoc node :db/id (dec (- idx))))) nodes))

(defn- map-sequential?
  [o]
  (not-any? (complement map?) o))

;;; some validators and specs
(declare contains-node?)
(defn- validate-nodes-not-contains-target
  [nodes target-id-or-entity db]
  (let [target (target-entity target-id-or-entity db)]
    (assert (not (contains-node? nodes target)))))

(s/def ::target-node-map (s/keys :req [:block/level :block/page :db/id]
                                 :opt [:block/next]))

(s/def ::target-id-or-entity (s/or :id int?
                                   :entity de/entity?
                                   :map ::target-node-map))


;;; write-operations on outliner nodes (no side effects) ;;;;;;;;;;;;;;;;
;; all operation functions are pure, return transaction data

(defn insert-nodes
  "insert NODES as consecutive sorted nodes after target as siblings or children.
  return transaction data."
  [nodes db target-id-or-entity sibling?]
  {:pre [(s/valid? ::target-id-or-entity target-id-or-entity)
         (map-sequential? nodes)]}
  (let [nodes (assign-temp-id nodes)
        target (target-entity target-id-or-entity db)
        target-or-its-last-child (skip-children target db)
        next (get-next target-or-its-last-child db)
        first-node (first nodes)
        last-node (last nodes)
        diff-level (get-diff-level first-node target sibling?)
        update-level-txs
        (sequence
         (comp
          (map #(merge % (set-level % (+ diff-level (get-level %)))))
          (map #(save-aux db %))
          cat)
         nodes)
        update-next-id-txs
        [(set-next target-or-its-last-child first-node)
         (set-next last-node next)]
        update-internal-nodes-next-id-txs
        (for [i (range)
              :let [n1 (nth nodes i nil)
                    n2 (nth nodes (inc i) nil)]
              :while (and n1 n2)]
          (set-next n1 n2))]
    (vec (concat update-level-txs update-next-id-txs update-internal-nodes-next-id-txs))))

(defn move-nodes
  "move consecutive sorted NODES after target as sibling or children
  return transaction data."
  [nodes db target-id-or-entity sibling?]
  ;; TODO: check NODES are consecutive
  {:pre [(seq nodes)
         (s/valid? ::target-id-or-entity target-id-or-entity)]}
  (let [target (target-entity target-id-or-entity db)
        target-next (get-next target db)
        first-node (first nodes)
        origin-prev-first-node (get-prev first-node db)
        last-node (last nodes)
        origin-next-last-node (get-next last-node db)
        diff-level (get-diff-level first-node target sibling?)]
    (into
     ;; alter :block/next
     (if (and target-next
              (= (get-id first-node) (get-id target-next)))
       ;; no need to set-next if first-node is next node of target
       []
       [(unset-next origin-prev-first-node)
        (set-next target first-node)
        (if target-next                 ; need to unset-next when target-next is nil
          (set-next last-node target-next)
          (unset-next last-node))
        (set-next origin-prev-first-node origin-next-last-node)])
     ;; alter :block/level
     (map #(set-level % (+ diff-level (get-level %))) nodes))))


(defn delete-nodes
  "delete consecutive sorted NODES.
  return transaction data."
  [nodes db]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        last-node (last nodes)
        target-node (get-prev first-node db)
        next-node (get-next last-node db)]
    (conj
     ;; retract nodes
     (mapv (fn [node] [:db/retractEntity (get-id node)]) nodes)
     ;; alter :block/next
     (set-next target-node next-node))))

(defn indent-nodes
  "indent consecutive sorted nodes.
  return transaction data."
  [nodes db]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        first-node-level (get-level first-node)
        target-node (get-prev first-node db)
        target-level (get-level target-node)]
    (when (>= target-level first-node-level)
      (map #(set-level % (inc (get-level %))) nodes))))

(defn outdent-nodes
  "outdent consecutive sorted nodes.
  return transaction data."
  [nodes db]
  {:pre [(seq nodes)]}
  (let [last-node (last nodes)
        last-node-level (get-level last-node)
        next-last-node (get-next last-node db)
        next-last-node-level (get-level next-last-node)]
    (when (and (<= next-last-node-level last-node-level)
                                        ;every node's level >= 1
               (not-any? #(<= (get-level %) 1) nodes))
      (map #(set-level % (dec (get-level %))) nodes))))


;;; get nodes functions ;;;;;;;;;;;;;;;;

(defn- get-children-nodes-aux
  [node db level]
  (lazy-seq
   (let [next-node (get-next node db)]
     (when (and next-node
                (> (get-level next-node) level))
       (cons next-node (get-children-nodes-aux next-node db level))))))

(defn get-children-nodes
  "return lazy sorted nodes: NODE itself and its children"
  [node db]
  (let [level (get-level node)]
    (cons node (get-children-nodes-aux node db level))))

(defn get-page-nodes
  "return lazy PAGE-NODE's sorted nodes"
  [page-node db]
  (lazy-seq
   (let [next-node (get-next page-node db)]
     (when next-node
       (cons next-node (get-page-nodes next-node db))))))

(defn get-prev-sibling-node
  "return previous node whose :block/level is same as NODE
  or nil(when NODE is first node in the page or it's the first child of its parent)"
  [node db]
  (let [level (get-level node)
        prev-node (get-prev node db)]
    (loop [node prev-node]
      ;; page-node doesn't have :block/level
      (when-let [level* (get-level node)]
        (cond
          (= level level*)
          node
          (< level level*)
          (recur (get-prev node db))
          (> level level*)
          nil)))))

(defn get-next-sibling-node
  "return next node whose :block/level is same as NODE
  or nil(when NODE is final one in the page or it's the last child of its parent)"
  [node db]
  (let [level (get-level node)
        next-node (get-next node db)]
    (loop [node next-node]
      (when (some? node)
        (let [level* (get-level node)]
          (cond
            (= level level*)
            node
            (< level level*)
            (recur (get-next node db))
            (> level level*)
            nil))))))

(defn get-parent-node
  "return NODE's parent node or nil when NODE is the first node of its page"
  [node db]
  (let [level (get-level node)]
    (loop [node node]
      (let [prev-node (get-prev node db)]
        (when-let [level* (get-level node)]
          (if (= level (dec level*))
            prev-node
            (recur prev-node)))))))

;;; predicates
(defn contains-node?
  "return not nil value if the consecutive sorted NODES contains NODE"
  [nodes node]
  (some #(= (get-id %) (get-id node)) nodes))


;;; write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(def ^:private ^:dynamic *transaction-data*
  "store transaction-data generated by one or more write-operations,
  see also `frontend.modules.outliner.transaction/save-transactions`"
  nil)

(defn insert-nodes!
  [nodes conn target-id-or-entity sibling?]
  {:pre [(d/conn? conn)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. "insert-nodes! used not in (save-transactions ...)")))
  (let [origin-tx-data (insert-nodes nodes @conn target-id-or-entity sibling?)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))

(defn move-nodes!
  [nodes conn target-id-or-entity sibling?]
  {:pre [(d/conn? conn)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. "move-nodes! used not in (save-transactions ...)")))
  (validate-nodes-not-contains-target nodes target-id-or-entity @conn)
  (let [origin-tx-data (move-nodes nodes @conn target-id-or-entity sibling?)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))

(defn delete-nodes!
  [nodes conn]
  {:pre [(d/conn? conn)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. "delete-nodes! used not in (save-transactions ...)")))
  (let [origin-tx-data (delete-nodes nodes @conn)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))

(defn indent-nodes!
  [nodes conn]
  {:pre [(d/conn? conn)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. "indent-nodes! used not in (save-transactions ...)")))
  (let [origin-tx-data (indent-nodes nodes @conn)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))

(defn outdent-nodes!
  [nodes conn]
  {:pre [(d/conn? conn)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. "outdent-nodes! used not in (save-transactions ...)")))
  (let [origin-tx-data (outdent-nodes nodes @conn)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))
