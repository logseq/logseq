(ns frontend.modules.outliner.core
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [frontend.modules.outliner.datascript :as ds]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.state :as state]
            [frontend.util :as util]))

(defrecord Block [data])

(defn block
  [m]
  (assert (map? m) (util/format "block data must be map, got: %s %s" (type m) m))
  (->Block m))

(defn get-data
  [block]
  (:data block))

(defn get-block-by-id
  [id]
  (let [c (conn/get-conn false)
        r (db-outliner/get-by-id c (outliner-u/->block-lookup-ref id))]
    (when r (->Block r))))

(defn- get-by-parent-&-left
  [parent-uuid left-uuid]
  (let [parent-id (:db/id (db/entity [:block/uuid parent-uuid]))
        left-id (:db/id (db/entity [:block/uuid left-uuid]))]
    (some->
     (db-model/get-by-parent-&-left (conn/get-conn) parent-id left-id)
     :db/id
     db/pull
     block)))

(defn- block-with-timestamps
  [block]
  (let [updated-at (util/time-ms)
        block (cond->
                (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn- remove-orphaned-page-refs!
  [db-id txs-state old-refs new-refs]
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
        (let [tx (mapv (fn [page] [:db/retractEntity (:db/id page)]) orphaned-pages)]
          (swap! txs-state (fn [state] (vec (concat state tx)))))))))

;; -get-id, -get-parent-id, -get-left-id return block-id
;; the :block/parent, :block/left should be datascript lookup ref

(extend-type Block
  tree/INode
  (-get-id [this]
    (or
     (when-let [block-id (get-in this [:data :block/uuid])]
       block-id)
     (when-let [db-id (get-in this [:data :db/id])]
       (let [uuid (:block/uuid (db/pull db-id))]
         (if uuid
           uuid
           (let [new-id (db/new-block-id)]
             (db/transact! [{:db/id db-id
                             :block/uuid new-id}])
             new-id))))))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent])
      (outliner-u/->block-id)))

  (-set-parent-id [this parent-id]
    (outliner-u/check-block-id parent-id)
    (update this :data assoc :block/parent [:block/uuid parent-id]))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left])
      (outliner-u/->block-id)))

  (-set-left-id [this left-id]
    (outliner-u/check-block-id left-id)
    (update this :data assoc :block/left [:block/uuid left-id]))

  (-get-parent [this]
    (when-let [parent-id (tree/-get-parent-id this)]
      (get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-by-parent-&-left parent-id parent-id)))

  (-save [this txs-state]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [m (-> (:data this)
                (dissoc :block/children :block/meta :block/top? :block/bottom?
                        :block/title :block/body :block/level)
                (util/remove-nils))
          m (if (state/enable-block-timestamps?) (block-with-timestamps m) m)
          other-tx (:db/other-tx m)
          id (:db/id (:data this))
          block-entity (db/entity id)
          old-refs (:block/refs block-entity)
          new-refs (:block/refs m)]
      (when (seq other-tx)
        (swap! txs-state (fn [txs]
                           (vec (concat txs other-tx)))))

      (when id
        (swap! txs-state (fn [txs]
                           (vec
                            (concat txs
                                    (map (fn [attribute]
                                           [:db/retract id attribute])
                                      db-schema/retract-attributes)))))

        (when-let [e (:block/page block-entity)]
          (let [m {:db/id (:db/id e)
                   :block/updated-at (util/time-ms)}
                m (if (:block/created-at e)
                    m
                    (assoc m :block/created-at (util/time-ms)))]
            (swap! txs-state conj m))
          (remove-orphaned-page-refs! (:db/id block-entity) txs-state old-refs new-refs)))

      (swap! txs-state conj (dissoc m :db/other-tx))

      this))

  (-del [this txs-state children?]
    (assert (ds/outliner-txs-state? txs-state)
      "db should be satisfied outliner-tx-state?")
    (let [block-id (tree/-get-id this)
          ids (set (if children?
                     (let [children (db/get-block-children (state/get-current-repo) block-id)
                           children-ids (map :block/uuid children)]
                       (conj children-ids block-id))
                     [block-id]))
          txs (map (fn [id] [:db.fn/retractEntity [:block/uuid id]]) ids)
          txs (if-not children?
                (let [immediate-children (db/get-block-immediate-children (state/get-current-repo) block-id)]
                  (if (seq immediate-children)
                    (let [left-id (tree/-get-id (tree/-get-left this))]
                      (concat txs
                              (map-indexed (fn [idx child]
                                             (let [parent [:block/uuid left-id]]
                                               (cond->
                                                 {:db/id (:db/id child)
                                                  :block/parent parent}
                                                 (zero? idx)
                                                 (assoc :block/left parent))))
                                           immediate-children)))
                    txs))
                  txs)]
      (swap! txs-state concat txs)
      block-id))

  (-get-children [this]
    (let [parent-id (tree/-get-id this)
          children (db-model/get-block-immediate-children (state/get-current-repo) parent-id)]
      (map block children))))

(defn set-block-collapsed! [txs-state id collapsed?]
  (swap! txs-state concat [{:db/id id
                            :block/collapsed? collapsed?}]))

(defn save-node
  ([node]
   (save-node node nil))
  ([node {:keys [txs-state]}]
   (if txs-state
     (tree/-save node txs-state)
     (ds/auto-transact!
      [db (ds/new-outliner-txs-state)] {:outliner-op :save-node}
      (tree/-save node db)))))

(defn insert-node-as-first-child
  "Insert a node as first child."
  [txs-state new-node parent-node]
  {:pre [(every? tree/satisfied-inode? [new-node parent-node])]}
  (let [parent-id (tree/-get-id parent-node)
        node (-> (tree/-set-left-id new-node parent-id)
               (tree/-set-parent-id parent-id))
        right-node (tree/-get-down parent-node)]
    (if (tree/satisfied-inode? right-node)
      (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
            saved-new-node (tree/-save node txs-state)]
        (tree/-save new-right-node txs-state)
        [saved-new-node new-right-node])
      (do
        (tree/-save node txs-state)
        [node]))))

(defn insert-node-as-sibling
  "Insert a node as sibling."
  [txs-state new-node left-node]
  {:pre [(every? tree/satisfied-inode? [new-node left-node])]}
  (when-let [left-id (tree/-get-id left-node)]
    (let [node (-> (tree/-set-left-id new-node left-id)
                   (tree/-set-parent-id (tree/-get-parent-id left-node)))
          right-node (tree/-get-right left-node)]
      (if (tree/satisfied-inode? right-node)
        (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
              saved-new-node (tree/-save node txs-state)]
          (tree/-save new-right-node txs-state)
          [saved-new-node new-right-node])
        (do
          (tree/-save node txs-state)
          [node])))))


(defn- insert-node-aux
  ([new-node target-node sibling? txs-state]
   (insert-node-aux new-node target-node sibling? txs-state nil))
  ([new-node target-node sibling? txs-state blocks-atom]
   (let [result (if sibling?
                  (insert-node-as-sibling txs-state new-node target-node)
                  (insert-node-as-first-child txs-state new-node target-node))]
     (when blocks-atom
       (swap! blocks-atom concat result))
     (first result))))

(defn insert-node
  ([new-node target-node sibling?]
   (insert-node new-node target-node sibling? nil))
  ([new-node target-node sibling? {:keys [blocks-atom skip-transact? txs-state]
                                   :or {skip-transact? false}}]
   (if txs-state
     (insert-node-aux new-node target-node sibling? txs-state blocks-atom)
     (ds/auto-transact!
      [txs-state (ds/new-outliner-txs-state)]
      {:outliner-op :insert-node
       :skip-transact? skip-transact?}
      (insert-node-aux new-node target-node sibling? txs-state blocks-atom)))))

;; TODO: refactor, move to insert-node
(defn insert-node-as-last-child
  [txs-state node target-node]
  []
  {:pre [(every? tree/satisfied-inode? [node target-node])]}
  (let [children (tree/-get-children target-node)
        [target-node sibling?] (if (seq children)
                                 [(last children) true]
                                 [target-node false])]
    (insert-node-aux node target-node sibling? txs-state)))


(defn- blocks-with-level
  "Should be sorted already."
  [blocks]
  (if (:block/level (first blocks))
    blocks
    (let [root (assoc (first blocks) :block/level 1)
          result (loop [m [[(:db/id root) root]]
                        blocks (rest blocks)]
                   (if (empty? blocks)
                     m
                     (let [block (first blocks)
                           parent-id (:db/id (:block/parent block))
                           parent-level (:block/level (second (first (filter (fn [x] (= (first x) parent-id)) m))))
                           block (assoc block :block/level (inc parent-level))
                           m' (vec (conj m [(:db/id block) block]))]
                       (recur m' (rest blocks)))))]
      (map last result))))

(defn get-top-level-blocks
  [blocks]
  (let [level-blocks (blocks-with-level blocks)]
    (filter (fn [b] (= 1 (:block/level b))) level-blocks)))

(defn- assign-temp-id
  [blocks]
  (map-indexed (fn [idx block]
                 (assoc block :db/id (dec (- idx)))) blocks))

(defn- insert-blocks-aux
  [blocks target-block sibling? replace-empty-target?]
  (let [uuids (zipmap (map :block/uuid blocks)
                      (repeatedly random-uuid))
        id->new-uuid (->> (map (fn [block] (if-let [id (:db/id block)]
                                             [id (get uuids (:block/uuid block))])) blocks)
                          (into {}))
        target-page (:db/id (:block/page target-block))
        get-new-id (fn [lookup]
                     (cond
                       (or (map? lookup) (vector? lookup))
                       (let [uuid (if (and (vector? lookup) (= (first lookup) :block/uuid))
                                    (get uuids (last lookup))
                                    (get id->new-uuid (:db/id lookup)))]
                         [:block/uuid uuid])

                       (integer? lookup)
                       lookup

                       :else
                       (throw (js/Error. (str "[insert-blocks] illegal lookup: " lookup)))))]
    (map-indexed (fn [idx {:block/keys [parent left] :as block}]
                   (let [top-level? (= (:block/level block) 1)]
                     (-> block
                         (merge {:block/uuid (get uuids (:block/uuid block))
                                 :block/page target-page
                                 :block/parent (if top-level?
                                                 (if sibling?
                                                   (:db/id (:block/parent target-block))
                                                   (:db/id target-block))
                                                 (get-new-id parent))
                                 :block/left (if (zero? idx)
                                               (if replace-empty-target?
                                                 (:db/id (:block/left target-block))
                                                 (:db/id target-block))
                                               (get-new-id left))})
                         (dissoc :db/id))))
                 blocks)))

(defn insert-blocks
  "Insert blocks as children (or siblings) of target-node.
  `blocks` should be sorted already."
  [blocks target-block sibling?]
  (let [sibling? (if (:block/name target-block) false sibling?)
        replace-empty-target? (and sibling?
                                   (string/blank? (:block/content target-block)))
        blocks' (blocks-with-level blocks)
        delete-target-tx (when replace-empty-target? [[:db.fn/retractEntity (:db/id target-block)]])
        _ (def blocks blocks)
        _ (def blocks' blocks')
        _ (def target-block target-block)
        tx (insert-blocks-aux blocks' target-block sibling? replace-empty-target?)
        tx (assign-temp-id tx)
        target-node (block target-block)
        next (if sibling?
               (tree/-get-right target-node)
               (tree/-get-down target-node))
        next-tx (when next
                  (when-let [left (last (filter (fn [b] (= 1 (:block/level b))) tx))]
                    [{:block/uuid (tree/-get-id next)
                      :block/left (:db/id left)}]))
        full-tx (util/concat-without-nil delete-target-tx tx next-tx)]
    {:tx-data full-tx
     :blocks tx}))

(defn move-nodes
  "Move nodes up/down."
  [nodes up?]
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :move-nodes}
    (let [first-node (first nodes)
          last-node (last nodes)
          left (tree/-get-left first-node)
          move-to-another-parent? (if up?
                                    (= left (tree/-get-parent first-node))
                                    (and (tree/-get-parent last-node)
                                         (nil? (tree/-get-right last-node))))
          [up-node down-node] (if up?
                                [left last-node]
                                (let [down-node (if move-to-another-parent?
                                                  (tree/-get-right (tree/-get-parent last-node))
                                                  (tree/-get-right last-node))]
                                  [first-node down-node]))]
      (when (and up-node down-node)
        (cond
          (and move-to-another-parent? up?)
          (when-let [target (tree/-get-left up-node)]
            (when (and (not (:block/name (:data target))) ; page root block
                       (not (= target
                               (when-let [parent (tree/-get-parent first-node)]
                                 (tree/-get-parent parent)))))
              (insert-node-as-last-child txs-state first-node target)
              (let [parent-id (tree/-get-id target)]
                (doseq [node (rest nodes)]
                  (let [node (tree/-set-parent-id node parent-id)]
                    (tree/-save node txs-state))))
              (when-let [down-node-right (tree/-get-right down-node)]
                (let [down-node-right (tree/-set-left-id down-node-right (tree/-get-id (tree/-get-parent first-node)))]
                  (tree/-save down-node-right txs-state)))))

          move-to-another-parent?       ; down?
          (do
            (insert-node-as-first-child txs-state first-node down-node)
            (let [parent-id (tree/-get-id down-node)]
              (doseq [node (rest nodes)]
                (let [node (tree/-set-parent-id node parent-id)]
                  (tree/-save node txs-state))))
            (when-let [down-node-down (tree/-get-down down-node)]
              (let [down-node-down (tree/-set-left-id down-node-down (tree/-get-id last-node))]
                (tree/-save down-node-down txs-state))))

          up?                           ; sibling
          (let [first-node (tree/-set-left-id first-node (tree/-get-left-id left))
                left (tree/-set-left-id left (tree/-get-id last-node))]
            (tree/-save first-node txs-state)
            (tree/-save left txs-state)
            (when-let [down-node-right (tree/-get-right down-node)]
              (let [down-node-right (tree/-set-left-id down-node-right (tree/-get-id left))]
                (tree/-save down-node-right txs-state))))

          :else                       ; down && sibling
          (let [first-node (tree/-set-left-id first-node (tree/-get-id down-node))
                down-node (tree/-set-left-id down-node (tree/-get-id left))]
            (tree/-save first-node txs-state)
            (tree/-save down-node txs-state)
            (when-let [down-node-right (tree/-get-right down-node)]
              (let [down-node-right (tree/-set-left-id down-node-right (tree/-get-id last-node))]
                (tree/-save down-node-right txs-state)))))))))

(defn delete-node
  "Delete node from the tree."
  [node children?]
  {:pre [(tree/satisfied-inode? node)]}
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :delete-node}
    (let [right-node (tree/-get-right node)]
      (tree/-del node txs-state children?)
      (when (tree/satisfied-inode? right-node)
        (let [left-node (tree/-get-left node)
              new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
          (tree/-save new-right-node txs-state))))))

(defn- get-left-nodes
  [node limit]
  (let [parent (tree/-get-parent node)]
    (loop [node node
           limit limit
           result []]
     (if (zero? limit)
       result
       (if-let [left (tree/-get-left node)]
         (if-not (= left parent)
           (recur left (dec limit) (conj result (tree/-get-id left)))
           result)
         result)))))

(defn delete-nodes
  "Delete nodes from the tree.
  Args:
    start-node: the node at the top of the outliner document.
    end-node: the node at the bottom of the outliner document
    block-ids: block ids between the start node and end node, including all the
  children.
  "
  [start-node end-node block-ids]
  {:pre [(tree/satisfied-inode? start-node)
         (tree/satisfied-inode? end-node)]}
  (ds/auto-transact!
   [txs-state (ds/new-outliner-txs-state)]
   {:outliner-op :delete-nodes}
   (let [end-node-parents (->>
                           (db/get-block-parents
                            (state/get-current-repo)
                            (tree/-get-id end-node)
                            1000)
                           (map :block/uuid)
                           (set))
         self-block? (contains? end-node-parents (tree/-get-id start-node))]
     (if (or (= start-node end-node)
             self-block?)
       (delete-node start-node true)
       (let [sibling? (= (tree/-get-parent-id start-node)
                         (tree/-get-parent-id end-node))
             right-node (tree/-get-right end-node)]
         (when (tree/satisfied-inode? right-node)
           (let [left-node-id (if sibling?
                                (tree/-get-id (tree/-get-left start-node))
                                (let [end-node-left-nodes (get-left-nodes end-node (count block-ids))
                                      parents (->>
                                               (db/get-block-parents
                                                (state/get-current-repo)
                                                (tree/-get-id start-node)
                                                1000)
                                               (map :block/uuid)
                                               (set))
                                      result (first (set/intersection (set end-node-left-nodes) parents))]
                                  (when-not result
                                    (util/pprint {:parents parents
                                                  :end-node-left-nodes end-node-left-nodes}))
                                  result))]
             (assert left-node-id "Can't find the left-node-id")
             (let [new-right-node (tree/-set-left-id right-node left-node-id)]
               (tree/-save new-right-node txs-state))))
         (let [txs (db-outliner/del-blocks block-ids)]
           (ds/add-txs txs-state txs)))))))

(defn first-child?
  [node]
  (=
   (tree/-get-left-id node)
   (tree/-get-parent-id node)))

(defn- first-level?
  "Can't be outdented."
  [node]
  (nil? (tree/-get-parent (tree/-get-parent node))))

(defn get-right-siblings
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (when-let [parent (tree/-get-parent node)]
    (let [children (tree/-get-children parent)]
      (->> (split-with #(not= (tree/-get-id node) (tree/-get-id %)) children)
           last
           rest))))

(defn- logical-outdenting
  [txs-state parent nodes first-node last-node last-node-right parent-parent-id parent-right]
  (some-> last-node-right
          (tree/-set-left-id (tree/-get-left-id first-node))
          (tree/-save txs-state))
  (let [first-node (tree/-set-left-id first-node (tree/-get-id parent))]
    (doseq [node (cons first-node (rest nodes))]
      (-> (tree/-set-parent-id node parent-parent-id)
          (tree/-save txs-state))))
  (some-> parent-right
          (tree/-set-left-id (tree/-get-id last-node))
          (tree/-save txs-state)))

(defn indent-outdent-nodes
  [nodes indent?]
  (ds/auto-transact!
   [txs-state (ds/new-outliner-txs-state)] {:outliner-op :indent-outdent-nodes}
   (let [first-node (first nodes)
         last-node (last nodes)]
     (if indent?
       (when-not (first-child? first-node)
         (let [first-node-left-id (tree/-get-left-id first-node)
               last-node-right (tree/-get-right last-node)
               parent-or-last-child-id (or (-> (db/get-block-immediate-children (state/get-current-repo)
                                                                                first-node-left-id)
                                               last
                                               :block/uuid)
                                           first-node-left-id)
               first-node (tree/-set-left-id first-node parent-or-last-child-id)]
           (doseq [node (cons first-node (rest nodes))]
             (-> (tree/-set-parent-id node first-node-left-id)
                 (tree/-save txs-state)))
           (some-> last-node-right
                   (tree/-set-left-id first-node-left-id)
                   (tree/-save txs-state))
           (when-let [parent (get-block-by-id first-node-left-id)]
             (when (db-model/block-collapsed? first-node-left-id)
               (set-block-collapsed! txs-state (:db/id (get-data parent)) false)))))
       (when-not (first-level? first-node)
         (let [parent (tree/-get-parent first-node)
               parent-parent-id (tree/-get-parent-id parent)
               parent-right (tree/-get-right parent)
               last-node-right (tree/-get-right last-node)
               last-node-id (tree/-get-id last-node)]
           (logical-outdenting txs-state parent nodes first-node last-node last-node-right parent-parent-id parent-right)
           (when-not (state/logical-outdenting?)
             ;; direct outdenting (the old behavior)
             (let [right-siblings (get-right-siblings last-node)
                   right-siblings (doall
                                   (map (fn [sibling]
                                          (some->
                                           (tree/-set-parent-id sibling last-node-id)
                                           (tree/-save txs-state)))
                                     right-siblings))]
               (when-let [last-node-right (first right-siblings)]
                 (let [last-node-children (tree/-get-children last-node)
                       left-id (if (seq last-node-children)
                                 (tree/-get-id (last last-node-children))
                                 last-node-id)]
                   (when left-id
                     (some-> (tree/-set-left-id last-node-right left-id)
                             (tree/-save txs-state)))))))))))))

(defn- set-nodes-page-aux
  [node page page-format txs-state]
  (let [new-node (update node :data assoc
                         :block/page page
                         :block/format page-format)]
    (tree/-save new-node txs-state)
    (doseq [n (tree/-get-children new-node)]
      (set-nodes-page-aux n page page-format txs-state))))

(defn- set-nodes-page
  [node target-node txs-state]
  (let [page (or (get-in target-node [:data :block/page])
                 {:db/id (get-in target-node [:data :db/id])}) ; or page block

        page-format (:block/format (db/entity (or (:db/id page) page)))]
    (set-nodes-page-aux node page page-format txs-state)))

(defn move-subtree
  "Move subtree to a destination position in the relation tree.
  Args:
    root: root of subtree
    target-node: the destination
    sibling?: as sibling of the target-node or child"
  [root target-node sibling?]
  {:pre [(every? tree/satisfied-inode? [root target-node])
         (boolean? sibling?)]}
  (if-let [target-node-id (tree/-get-id target-node)]
    (when-not (and
               (or (and sibling?
                        (= (tree/-get-left-id root) target-node-id)
                        (not= (tree/-get-parent-id root) target-node-id))
                   (and (not sibling?)
                        (= (tree/-get-left-id root) target-node-id)
                        (= (tree/-get-parent-id root) target-node-id)))
               (= target-node-id (tree/-get-id root)))
      (let [root-page (:db/id (:block/page (:data root)))
            target-page (:db/id (:block/page (:data target-node)))
            not-same-page? (not= root-page target-page)
            opts (cond-> {:outliner-op :move-subtree
                          :move-blocks [(:db/id (get-data root))]
                          :target (:db/id (get-data target-node))}
                   not-same-page?
                   (assoc :from-page root-page
                          :target-page target-page))]
        (ds/auto-transact!
         [txs-state (ds/new-outliner-txs-state)] opts
         (let [left-node-id (tree/-get-left-id root)
               right-node (tree/-get-right root)]
           (when (tree/satisfied-inode? right-node)
             (let [new-right-node (tree/-set-left-id right-node left-node-id)]
               (tree/-save new-right-node txs-state)))
           (let [new-root (first (if sibling?
                                   (insert-node-as-sibling txs-state root target-node)
                                   (insert-node-as-first-child txs-state root target-node)))]
             (when (not= root-page target-page)
               (set-nodes-page new-root target-node txs-state)))))))
    (js/console.trace)))

(defn get-right-node
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (tree/-get-right node))

;;; write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(def ^:private ^:dynamic *transaction-data*
  "Stores transaction-data that are generated by one or more write-operations,
  see also `frontend.modules.outliner.transaction/save-transactions`"
  nil)

(defn- op-transact!
  [fn-var & args]
  {:pre [(var? fn-var)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. (str (:name (meta fn-var)) " is not used in (save-transactions ...)"))))
  (let [result (apply @fn-var args)]
    (apply conj! *transaction-data* (:tx-data result))
    result))

(defn save-block!
  [block]
  (op-transact! #'save-node block))

(defn insert-blocks!
  [blocks target-block sibling?]
  (op-transact! #'insert-blocks blocks target-block sibling?))
