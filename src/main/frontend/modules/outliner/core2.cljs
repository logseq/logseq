(ns frontend.modules.outliner.core2
  "Outliner core operations and corresponding db transact fns."
  (:require [datascript.impl.entity :as de]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.modules.outliner.transaction]
            [frontend.spec :as spec]
            [cljs.spec.alpha :as s]
            [clojure.set :as set]))

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
(defn- get-last-child-or-itself
  "Get the last child node of NODE, or NODE itself when no child"
  [db node]
  (let [parent-nodes (set (get-parent-nodes db node))]
    (loop [last-node node
           node (get-next db node)]
      (cond
        (nil? node) last-node
        (contains? parent-nodes (get-parent db node)) last-node
        :else (recur node (get-next db node))))))

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

(defn get-next [db o]
  (cond
    (implements? Node o)
    (-get-next o db)

    (map? o)
    (map-get-next o db)

    :else
    (throw (js/Error. (str "cannot get-next on " o)))))

(defn get-prev [db o]
  (cond
    (implements? Node o)
    (-get-prev o db)

    (map? o)
    (map-get-prev o db)

    :else
    (throw (js/Error. (str "cannot get-prev on " o)))))

(defn get-parent [db o]
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

(defn node= [o1 o2] (= (get-id o1) (get-id o2)))

;;; node apis ends here

(defn save-node
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

(defn- target-entity [db id-or-entity]
  (if (or (instance? de/Entity id-or-entity) (map? id-or-entity))
    id-or-entity
    (d/entity db id-or-entity)))

(defn get-top-level-nodes
  "Get toplevel nodes of consecutive NODES"
  [db nodes]
  (let [node-ids-set (into #{} (map get-id) nodes)
        toplevel-nodes (transient [])]
    (loop [node (first nodes)]
      (let [node* (get-last-child-or-itself db node)
            next-node (get-next db node*)]
        (conj! toplevel-nodes node)
        (when (and next-node (contains? node-ids-set (get-id next-node)))
          (recur next-node))))
    (persistent! toplevel-nodes)))

(defn get-top-level-children
  "Get toplevel consecutive children of NODES"
  [db node]
  (let [parent-nodes (set (get-parent-nodes db node))
        children (transient [])]
    (loop [node* (get-next db node)]
      (when-let [parent-node (and node* (get-parent db node*))]
        (cond
          ;; found
          (= parent-node node)
          (do (conj! children node*)
              (recur (get-next db node*)))
          ;; finish
          (contains? parent-nodes parent-node) nil
          ;; not toplevel child
          :else (recur (get-next db node*)))))
    (persistent! children)))

(defn- assign-temp-id
  [nodes]
  (map-indexed (fn [idx node]
                 (if (get-id node)
                   node
                   (assoc node :db/id (dec (- idx))))) nodes))

(defn- map-with-keys-sequential?
  [o required-keys]
  (every? #(and (map? %) (seq (set/intersection (set required-keys) (set (keys %))))) o))

;;; some validators and specs
(declare contains-node?)
(defn- validate-nodes-not-contains-target
  [db nodes target-id-or-entity]
  (let [target (target-entity db target-id-or-entity)]
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
  "Return NODE's parent-nodes,
  [parent, parent's parent, ...]"
  [db node]
  (let [parent-nodes (transient [])]
    (loop [node node]
      (when-let [parent-node (get-parent db node)]
        (conj! parent-nodes parent-node)
        (recur parent-node)))
    (persistent! parent-nodes)))

(defn get-node-level
  "level = count(parent-nodes)"
  [db node]
  (count (get-parent-nodes db node)))

(defn get-children-nodes
  "Get NODE's children including itself,
  see also `with-children-nodes`"
  [db node]
  (let [parent-nodes (set (get-parent-nodes db node))
        children-nodes (transient [node])]
    (loop [node (get-next db node)]
      (when (and node
                 (some->> (get-parent db node)
                          (contains? parent-nodes)
                          not))
        (conj! children-nodes node)
        (recur (get-next db node))))
    (persistent! children-nodes)))

(defn get-page-nodes
  "Return lazy PAGE-NODE's sorted nodes"
  [db page-node]
  (lazy-seq
   (let [next-node (get-next db page-node)]
     (when next-node
       (cons next-node (get-page-nodes db next-node))))))

(defn get-prev-sibling-node
  "Return previous node whose :block/parent is same as NODE
  or nil(when NODE is first node in the page or it's the first child of its parent)"
  [db node]
  (let [parent-node (get-parent db node)]
    (loop [node (get-prev db node)]
      (when node
        (when-let [parent-node* (get-parent db node)]
          (cond
            ;; found
            (= parent-node* parent-node) node
            ;; node is NODE's parent
            (= parent-node node) nil
            :else (recur (get-prev db node))))))))

(defn get-next-sibling-node
  "Return next node whose :block/parent is same as NODE
  or nil(when NODE is final one in the page or it's the last child of its parent)"
  [db node]
  (let [parent-node (get-parent db node)
        parent-parent-nodes (set (get-parent-nodes db node))]
    (loop [node (get-next db node)]
      (when node
        (when-let [parent-node* (get-parent db node)]
          (cond
            ;; found
            (= parent-node* parent-node) node
            ;; node isn't a child of NODE
            (contains? parent-parent-nodes parent-node*) nil
            :else (recur (get-next db node))))))))


(defn with-children-nodes
  "Return nodes includes NODES themselves and their children.
  e.g.
  page nodes as following:
  - 1
    - 2
  - 3
    - 4
      - 5
  NODES = [1 3 4],  return [1 2 3 4 5]
  NODES = [1 3],    return [1 2 3 4 5]"
  [db nodes]
  {:post [(spec/valid? (s/coll-of some?) %)]}
  (let [node-ids-set (set (mapv get-id nodes))
        r (transient [])]
    (loop [node (first nodes)]
      (when node
        (let [node-and-children (get-children-nodes db node)]
          (conj! r node-and-children)
          (when-let [next-sibling (get-next-sibling-node db node)]
            (when (contains? node-ids-set (get-id next-sibling))
              (recur next-sibling))))))
    (flatten (persistent! r))))


;;; write-operations on outliner nodes (no side effects) ;;;;;;;;;;;;;;;;
;; all operation functions are pure, return transaction data

(declare page-node?)
(defn insert-nodes
  "Insert NODES as consecutive sorted nodes after target as siblings or children.
  Returns transaction data.
  NODES should have [:level int?] kv, toplevel is 1"
  [db nodes target-id-or-entity sibling?]
  {:pre [(spec/valid? ::target-id-or-entity target-id-or-entity)
         (map-with-keys-sequential? nodes [:level])]}
  (let [nodes (assign-temp-id nodes)
        target (target-entity db target-id-or-entity)
        target-or-its-last-child (get-last-child-or-itself db target)
        ;; if sibling?, insert after target's last child, else, insert after target
        target* (if sibling? target-or-its-last-child target)
        next (if sibling?
               (get-next db target-or-its-last-child)
               (get-next db target))
        first-node (first nodes)
        last-node (last nodes)
        parent-node
        (if (and (not (page-node? db target)) sibling?) (get-parent db target) target)
        update-next-id-txs
        [(set-next target* first-node)
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
                 (save-node db (merge (dissoc node :level) (set-parent node (get parent-node-map (dec level))))))
          (recur (assoc parent-node-map level node) tail))))
    (vec (concat (flatten (persistent! update-parent-txs)) update-next-id-txs update-internal-nodes-next-id-txs))))

(defn move-nodes
  "Move consecutive sorted NODES after target as siblings or children.
  Returns transaction data."
  [db nodes target-id-or-entity sibling?]
  ;; TODO: check NODES are consecutive
  {:pre [(seq nodes)
         (spec/valid? ::target-id-or-entity target-id-or-entity)
         ;; (= nodes (with-children-nodes db nodes))
         ]}
  (validate-nodes-not-contains-target db nodes target-id-or-entity)
  (let [node-ids-set (into #{} (map get-id) nodes)
        target (target-entity db target-id-or-entity)
        ;; if target is page-node, sibling? must be false
        sibling? (if (page-node? db target) false sibling?)
        ;; target* = last-child(node-ids-set doesn't contain it)
        ;; or target itself
        ;; loop to find previous node not included in NODES,
        ;; e.g. NODES maybe moved to same place but sibling?(or not)
        ;; - 1
        ;;   - 2    move 3,4 to target(1) as sibling=true
        ;;     - 3
        ;;   - 4
        target*
        (if sibling?
          (loop [target* (get-last-child-or-itself db target)]
            (if (contains? node-ids-set (get-id target*))
              (recur (get-prev db target*))
              target*))
          target)
        target-next
        (loop [target-next (get-next db target*)]
          (when target-next
            (if (contains? node-ids-set (get-id target-next))
              (recur (get-next db target-next))
              target-next)))

        first-node (first nodes)
        origin-prev-first-node (get-prev db first-node)
        last-node (last nodes)
        origin-next-last-node (get-next db last-node)
        parent-node (if sibling? (get-parent db target) target)]
    (into
     ;; alter :block/next
     (if (and target-next (node= first-node target-next))
       ;; no need to set-next if first-node is next node of target
       []
       [(unset-next origin-prev-first-node)
        (set-next target* first-node)
        (if target-next   ; need to unset-next when target-next is nil
          (set-next last-node target-next)
          (unset-next last-node))
        (when-not (and target-next origin-next-last-node
                       (node= target-next origin-next-last-node))
          (set-next origin-prev-first-node origin-next-last-node))])
     (let [toplevel-nodes (get-top-level-nodes db nodes)]
       ;; alter :block/parent
       (map #(set-parent % parent-node) toplevel-nodes)))))


;; move nodes up/down examples:
;; 1)
;; - 1
;;   - 2
;;   - 3
;; == move 3 up ==
;; - 1
;;   - 3
;;   - 2
;; -----------------
;; 2)
;; - 1
;; - 2
;;   - 3
;; - 4
;; == move 3,4 up ==
;; - 1
;;   - 3
;;   - 4
;; - 2
;; -----------------
;; 3)
;; - 1
;; - 2
;;   - 3
;;   - 4
;; - 5
;; == move 4,5 up ==
;; - 1
;; - 2
;;   - 4
;;   - 5
;;   - 3
(def reverse-list (comp reverse list))

(defn move-nodes-up
  [db nodes]
  {:pre [(seq nodes)]}
  (let [first-node (first nodes)
        prev-sibling-node (get-prev-sibling-node db first-node)
        [target-node sibling?]
        (or (some->> prev-sibling-node (get-prev-sibling-node db) (reverse-list true))
            (some->> prev-sibling-node (get-parent db) (reverse-list false))
            (when-let [prev-parent (some->> (get-parent db first-node) (get-prev-sibling-node db))]
              (if-let [last-toplevel-children (last (get-top-level-children db prev-parent))]
                [last-toplevel-children true]
                [prev-parent false])))]
    (when target-node
      (move-nodes db nodes target-node sibling?))))

(defn move-nodes-down
  [db nodes]
  {:pre [(seq nodes)]}
  (let [last-toplevel-node (last (get-top-level-nodes db nodes))
        next-sibling-node (get-next-sibling-node db last-toplevel-node)
        [target-node sibling?]
        (or (some->> next-sibling-node (reverse-list true))
            (some->> (get-parent db last-toplevel-node)
                     (get-next-sibling-node db)
                     (reverse-list false)))]
    (when target-node
      (move-nodes db nodes target-node sibling?))))

(defn delete-nodes
  "Delete consecutive sorted NODES.
  Returns transaction data."
  [db nodes]
  {:pre [(seq nodes)]}
  ;; TODO: ensure nodes=NODES+children
  (let [first-node (first nodes)
        last-node (last nodes)
        target-node (get-prev db first-node)
        next-node (get-next db last-node)]
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

(defn- get-min-level-nodes
  [db nodes]
  (let [nodes-and-level
        (mapv (juxt identity #(get-node-level db %)) (get-top-level-nodes db nodes))
        min-level
        (second (apply min-key second nodes-and-level))]
    (sequence
     (comp
      (filter #(= min-level (second %)))
      (map first))
     nodes-and-level)))

(defn indent-nodes
  "Indent consecutive sorted nodes.
  Returns transaction data."
  [db nodes]
  (let [filtered-nodes (get-min-level-nodes db nodes)]
    (when-let [target-node (some->> (first filtered-nodes) (get-prev-sibling-node db))]
      (mapv #(set-parent % target-node) filtered-nodes))))

(defn outdent-nodes
  "Outdent consecutive sorted nodes.
  Returns transaction data."
  [db nodes]
  (let [filtered-nodes (get-min-level-nodes db nodes)]
    (when-let [target-node (some->> (first filtered-nodes) (get-parent db) (get-parent db))]
      (let [next-siblings (transient [])]
        (loop [node (get-next-sibling-node db (last filtered-nodes))]
          (when node
            (conj! next-siblings node)
            (recur (get-next-sibling-node db node))))
        (concat
         (mapv #(set-parent % target-node) filtered-nodes)
         (mapv #(set-parent % (last filtered-nodes)) (persistent! next-siblings)))))))


;;; predicates
(defn page-node?
  [db node]
  (nil? (get-parent db node)))

(defn contains-node?
  "Returns true if the consecutive sorted NODES contains NODE"
  [nodes node]
  (some #(node= node %) nodes))

;;; write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(def ^:private ^:dynamic *transaction-data*
  "Stores transaction-data that are generated by one or more write-operations,
  see also `frontend.modules.outliner.transaction/save-transactions`"
  nil)

(defn- op-transact!
  [conn fn-var & args]
  {:pre [(d/conn? conn) (var? fn-var)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. (str (:name (meta fn-var)) " is not used in (save-transactions ...)"))))
  (let [origin-tx-data (apply @fn-var @conn args)
        tx-report (d/transact! conn origin-tx-data)]
    (apply conj! *transaction-data* (:tx-data tx-report))))

(defn save-node!
  [conn node]
  (op-transact! conn #'save-node node))

(defn insert-nodes!
  [conn nodes target-id-or-entity sibling?]
  (op-transact! conn #'insert-nodes nodes target-id-or-entity sibling?))

(defn move-nodes!
  [conn nodes target-id-or-entity sibling?]
  (op-transact! conn #'move-nodes nodes target-id-or-entity sibling?))

(defn move-nodes-up!
  [conn nodes]
  (op-transact! conn #'move-nodes-up nodes))

(defn move-nodes-down!
  [conn nodes]
  (op-transact! conn #'move-nodes-down nodes))

(defn delete-nodes!
  [conn nodes]
  (op-transact! conn #'delete-nodes nodes))

(defn indent-nodes!
  [conn nodes]
  (op-transact! conn #'indent-nodes nodes))

(defn outdent-nodes!
  [conn nodes]
  (op-transact! conn #'outdent-nodes nodes))
