(ns frontend.modules.outliner.core2
  (:require [datascript.impl.entity :as de]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.modules.outliner.transaction]
            [frontend.spec :as spec]
            [cljs.spec.alpha :as s]))

;;; Commentary
;; properties related to block position:
;; - :block/next: next node's :db/id
;; - DELETED :block/level: node's indent level (>= 1)
;; - :block/parent: node's parent :db/id
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

(declare get-parent-nodes get-next get-parent)
(defn- skip-children
  "get the last child node of NODE, or NODE itself when no child"
  [node db]
  (let [parent-nodes (set (get-parent-nodes node db))]
    (loop [last-node node
           node (get-next node db)]
      (cond
        (nil? node) last-node
        (contains? parent-nodes (get-parent node db)) last-node
        :else (recur node (get-next node db))))))

(defn- page-node?
  [node db]
  (nil? (get-parent node db)))

;;; Node apis
(defprotocol Node
  (-get-id [this] "return :db/id or nil")
  (-get-next [this db] "return next entity or nil")
  (-get-prev [this db] "return prev entity or nil")
  (-get-parent [this] "return parent node or nil")
  (-unset-next [this] "transaction to remove :block/next attr")
  (-set-next [this id-or-node] "transaction to add :block/next attr")
  (-set-parent [this id-or-node] "transaction to add :block/parent attr"))


(extend-protocol Node
  de/Entity
  (-get-id [this] (:db/id this))
  (-get-next [this _] (:block/next this))
  (-get-prev [this db] (d/entity db [:block/next (:db/id this)]))
  (-get-parent [this] (:block/parent this))
  (-unset-next [this] [:db.fn/retractAttribute (:db/id this) :block/next])
  (-set-next [this id-or-node]
    (when id-or-node
      (cond->> id-or-node
        (not (number? id-or-node)) :db/id
        true (assoc (id-map this) :block/next))))
  (-set-parent [this id-or-node]
    (when id-or-node
      (cond->> id-or-node
        (not (number? id-or-node)) :db/id
        true (assoc (id-map this) :block/parent)))))

(defn- map-get-id [this] (:db/id this))
(defn- map-get-next [this db] (d/entity db (:db/id (:block/next this))))
(defn- map-get-prev [this db] (d/entity db [:block/next (:db/id this)]))
(defn- map-get-parent [this db] (d/entity db (:db/id (:block/parent this))))
(defn- map-unset-next [this] [:db.fn/retractAttribute (:db/id this) :block/next])
(defn- map-set-next [this id-or-node]
  (when id-or-node
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc (id-map this) :block/next))))
(defn- map-set-parent [this id-or-node]
  (when id-or-node
    (cond->> id-or-node
      (not (number? id-or-node)) :db/id
      true (assoc (id-map this) :block/parent))))

(defn get-id [o]
  (cond
    (implements? Node o)
    (-get-id o)

    (map? o)
    (map-get-id o)

    :else
    (throw (js/Error. (str "cannot get-id on " o)))))

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

(defn get-parent [o db]
  (cond
    (implements? Node o)
    (-get-parent o)

    (map? o)
    (map-get-parent o db)

    :else
    (throw (js/Error. (str "cannot get-parent on " o)))))

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

(defn set-parent [o id-or-node]
  (cond
    (implements? Node o)
    (-set-parent o id-or-node)

    (map? o)
    (map-set-parent o id-or-node)

    :else
    (throw (js/Error. (str "cannot set-parent on " o)))))

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

(defn get-top-level-nodes
  "get toplevel nodes of consecutive NODES"
  [nodes db]
  (let [nodes-set (set nodes)
        toplevel-nodes (transient [])]
    (loop [node (first nodes)]
      (let [node* (skip-children node db)
            next-node (get-next node* db)]
        (conj! toplevel-nodes node)
        (when (and next-node (contains? nodes-set next-node))
          (recur next-node))))
    (persistent! toplevel-nodes)))

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
    (assert (not (contains-node? nodes target))
            {:nodes nodes
             :target target})))

(s/def ::target-node-map (s/keys :req [:block/level :block/page :db/id]
                                 :opt [:block/next]))

(s/def ::target-id-or-entity (s/or :id int?
                                   :entity de/entity?
                                   :map ::target-node-map))

;;; get nodes functions ;;;;;;;;;;;;;;;;

(defn get-parent-nodes
  "return NODE's parent-nodes,
  [parent, parent's parent, ...]"
  [node db]
  (let [parent-nodes (transient [])]
    (loop [node node]
      (when-let [parent-node (get-parent node db)]
        (conj! parent-nodes parent-node)
        (recur parent-node)))
    (persistent! parent-nodes)))

(defn get-node-level
  "level = count(parent-nodes)"
  [node db]
  (count (get-parent-nodes node db)))

(defn get-children-nodes
  "include NODE itself"
  [node db]
  (let [parent-nodes (set (get-parent-nodes node db))
        children-nodes (transient [node])]
    (loop [node (get-next node db)]
      (when (and node
                 (some->> (get-parent node db)
                          (contains? parent-nodes)
                          not))
        (conj! children-nodes node)
        (recur (get-next node db))))
    (persistent! children-nodes)))

(defn get-page-nodes
  "return lazy PAGE-NODE's sorted nodes"
  [page-node db]
  (lazy-seq
   (let [next-node (get-next page-node db)]
     (when next-node
       (cons next-node (get-page-nodes next-node db))))))


(defn get-prev-sibling-node
  "return previous node whose :block/parent is same as NODE
  or nil(when NODE is first node in the page or it's the first child of its parent)"
  [node db]
  (let [parent-node (get-parent node db)]
    (loop [node (get-prev node db)]
      (when node
        (when-let [parent-node* (get-parent node db)]
          (cond
            ;; found
            (= parent-node* parent-node) node
            ;; node is NODE's parent
            (= parent-node node) nil
            :else (recur (get-prev node db))))))))

(defn get-next-sibling-node
  "return next node whose :block/parent is same as NODE
  or nil(when NODE is final one in the page or it's the last child of its parent)"
  [node db]
  (let [parent-node (get-parent node db)
        parent-parent-nodes (set (get-parent-nodes node db))]
    (loop [node (get-next node db)]
      (when node
        (when-let [parent-node* (get-parent node db)]
          (cond
            ;; found
            (= parent-node* parent-node) node
            ;; node isn't a child of NODE
            (contains? parent-parent-nodes parent-node*) nil
            :else (recur (get-next node db))))))))

;;; write-operations on outliner nodes (no side effects) ;;;;;;;;;;;;;;;;
;; all operation functions are pure, return transaction data

(defn insert-nodes
  "insert NODES as consecutive sorted nodes after target as siblings or children.
  return transaction data.
  NODES should have [:level int?] kv, toplevel is 1"
  [nodes db target-id-or-entity sibling?]
  {:pre [(spec/valid? ::target-id-or-entity target-id-or-entity)
         (map-sequential? nodes)]}
  (let [nodes (assign-temp-id nodes)
        target (target-entity target-id-or-entity db)
        target-or-its-last-child (skip-children target db)
        next (get-next target-or-its-last-child db)
        first-node (first nodes)
        last-node (last nodes)
        parent-node
        (if (and (not (page-node? target db)) sibling?) (get-parent target db) target)
        update-next-id-txs
        [(set-next target-or-its-last-child first-node)
         (set-next last-node next)]
        update-internal-nodes-next-id-txs
        (for [i (range)
              :let [n1 (nth nodes i nil)
                    n2 (nth nodes (inc i) nil)]
              :while (and n1 n2)]
          (set-next n1 n2))
        update-parent-txs (transient [])]
    (loop [parent-node-map {0 parent-node}
           [node & tail] nodes]
      (when node
        (let [level (:level node)]
          (conj! update-parent-txs
                 (save-aux db (merge node (set-parent node (get parent-node-map (dec level))))))
          (recur (assoc parent-node-map level node) tail))))
    (vec (concat (flatten (persistent! update-parent-txs)) update-next-id-txs update-internal-nodes-next-id-txs))))

(defn move-nodes
  "move consecutive sorted NODES after target as sibling or children
  return transaction data."
  [nodes db target-id-or-entity sibling?]
  ;; TODO: check NODES are consecutive
  ;; TODO: nodes should be NODES+children
  {:pre [(seq nodes)
         (spec/valid? ::target-id-or-entity target-id-or-entity)]}
  (validate-nodes-not-contains-target nodes target-id-or-entity db)
  (let [target (target-entity target-id-or-entity db)
        target-next (get-next target db)
        first-node (first nodes)
        origin-prev-first-node (get-prev first-node db)
        last-node (last nodes)
        origin-next-last-node (get-next last-node db)
        parent-node (if sibling? (get-parent target db) target)]
    (into
     ;; alter :block/next
     (if (and target-next
              (= (get-id first-node) (get-id target-next)))
       ;; no need to set-next if first-node is next node of target
       []
       [(unset-next origin-prev-first-node)
        (set-next target first-node)
        (if target-next   ; need to unset-next when target-next is nil
          (set-next last-node target-next)
          (unset-next last-node))
        (set-next origin-prev-first-node origin-next-last-node)])
     (let [toplevel-nodes (get-top-level-nodes nodes db)]
       (concat
        ;; alter :block/parent
        (map #(set-parent % parent-node) toplevel-nodes)
        ;; if sibling? , then we need to update prev-sibling's children's parent
        (when sibling?
          (sequence
           (comp
            (filter (fn [d] (not (contains? (set (mapv :db/id toplevel-nodes)) (:e d)))))
            (map (fn [d] {:db/id (:e d) :block/parent (get-id (last toplevel-nodes))})))
           (d/datoms db :avet :block/parent (get-id target)))))))))


(defn delete-nodes
  "delete consecutive sorted NODES.
  return transaction data."
  [nodes db]
  {:pre [(seq nodes)]}
  ;; TODO: nodes=NODES+children
  (let [first-node (first nodes)
        last-node (last nodes)
        target-node (get-prev first-node db)
        next-node (get-next last-node db)]
    (conj
     ;; retract nodes
     (mapv (fn [node] [:db/retractEntity (get-id node)]) nodes)
     ;; alter :block/next
     (set-next target-node next-node))))


;; indent/outdent rule:
;; only indent or outdent min-level nodes(and its children)
;; example:
;; - 1
;;   - 2
;;     - 3
;;   - 4
;;   - 5
;;     - 6
;; nodes = [3,4,5,6]
;; then, [4,5,6] should be indented

(defn indent-nodes
  "indent consecutive sorted nodes.
  return transaction data."
  [nodes db]
  (let [nodes-and-level
        (mapv (juxt identity #(get-node-level % db)) (get-top-level-nodes nodes db))
        min-level
        (second (apply min-key second nodes-and-level))
        filtered-nodes
        (sequence
         (comp
          (filter #(= min-level (second %)))
          (map first))
         nodes-and-level)]
    (when-let [target-node (some-> (first filtered-nodes) (get-prev-sibling-node db))]
      (mapv #(set-parent % target-node) filtered-nodes))))

(defn outdent-nodes
  "outdent consecutive sorted nodes.
  return transaction data."
  [nodes db]
  (let [nodes-and-level
        (mapv (juxt identity #(get-node-level % db)) (get-top-level-nodes nodes db))
        min-level
        (second (apply min-key second nodes-and-level))
        filtered-nodes
        (sequence
         (comp
          (filter #(= min-level (second %)))
          (map first))
         nodes-and-level)]
    (when-let [target-node (some-> (first filtered-nodes) (get-parent db) (get-parent db))]
      (let [next-siblings (transient [])]
        (loop [node (get-next-sibling-node (last filtered-nodes) db)]
          (when node
            (conj! next-siblings node)
            (recur (get-next-sibling-node node db))))
        (concat
         (mapv #(set-parent % target-node) filtered-nodes)
         (mapv #(set-parent % (last filtered-nodes)) (persistent! next-siblings)))))))


;;; predicates
(defn contains-node?
  "return not nil value if the consecutive sorted NODES contains NODE"
  [nodes node]
  (some #(= (get-id %) (get-id node)) nodes))

(defn split-unconsecutive-nodes
  [nodes db]
  (let [nodes-groups (transient [])]
    (loop [prev-node (first nodes)
           group (transient [(first nodes)])
           [node & tail-nodes] (rest nodes)]
      (if (nil? node)
        (persistent! (conj! nodes-groups (persistent! group)))
        (if (= (get-id node) (some-> (get-next prev-node db) get-id))
          (do (conj! group node)
              (recur node group tail-nodes))
          (do (conj! nodes-groups (persistent! group))
              (recur node (transient [node]) tail-nodes)))))))


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
