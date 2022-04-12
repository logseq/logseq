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

(defn get-right-node
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (tree/-get-right node))

(defn get-left-sibling
  [db-id]
  (when db-id
    (let [block (db/entity db-id)
          left-id (:db/id (:block/left block))]
      (when (and left-id (not= left-id (:db/id (:block/parent block))))
        (db/entity left-id)))))

(defn get-right-sibling
  [db-id]
  (when db-id
    (when-let [block (db/entity db-id)]
     (db-model/get-by-parent-&-left (conn/get-conn)
                                    (:db/id (:block/parent block))
                                    db-id))))

(defn set-block-collapsed! [txs-state id collapsed?]
  (swap! txs-state concat [{:db/id id
                            :block/collapsed? collapsed?}]))

(defn save-block
  [blok]
  (let [txs-state (atom [])]
    (tree/-save (block blok) txs-state)
    {:tx-data @txs-state}))

(defn- blocks-with-level
  "Should be sorted already."
  [blocks move?]
  (let [first-block (first blocks)]
    (if (and (:block/level first-block) (:block/children first-block))          ; extracting from markdown/org
      blocks
      (let [root (assoc (first blocks) :block/level 1)
            result (loop [m [[(:db/id root) root]]
                          blocks (rest blocks)
                          last-top-level-block root]
                     (if (empty? blocks)
                       m
                       (let [block (first blocks)
                             parent-id (:db/id (:block/parent block))
                             parent-level (:block/level (second (first (filter (fn [x] (= (first x) parent-id)) m))))
                             block (assoc block :block/level (inc parent-level))
                             top-level? (= 1 (:block/level block))
                             block' (if (and top-level? (not move?))
                                      (assoc block :block/left [:block/uuid (:block/uuid last-top-level-block)])
                                      block)
                             m' (vec (conj m [(:db/id block') block']))
                             last-top-level-block' (if top-level? block' last-top-level-block)]
                         (recur m' (rest blocks) last-top-level-block'))))]
        (map last result)))))

(defn get-top-level-blocks
  [blocks]
  (let [level-blocks (blocks-with-level blocks true)]
    (filter (fn [b] (= 1 (:block/level b))) level-blocks)))

(defn- assign-temp-id
  [blocks replace-empty-target? target-block]
  (map-indexed (fn [idx block]
                 (let [db-id (if (and replace-empty-target? (zero? idx))
                               (:db/id target-block)
                               (dec (- idx)))]
                   (assoc block :db/id db-id))) blocks))

(defn- insert-blocks-aux
  [blocks target-block {:keys [sibling? replace-empty-target? keep-uuid? move?]}]
  (let [block-uuids (map :block/uuid blocks)
        uuids (zipmap block-uuids
                      (if keep-uuid?
                        block-uuids
                        (repeatedly random-uuid)))
        uuids (if replace-empty-target?
                (assoc uuids (:block/uuid (first blocks)) (:block/uuid target-block))
                uuids)
        id->new-uuid (->> (map (fn [block] (when-let [id (:db/id block)]
                                             [id (get uuids (:block/uuid block))])) blocks)
                          (into {}))
        target-page (or (:db/id (:block/page target-block))
                        ;; target block is a page itself
                        (:db/id target-block))
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
                   (when-let [uuid (get uuids (:block/uuid block))]
                     (let [top-level? (= (:block/level block) 1)]
                       (cond->
                         (merge block {:block/uuid uuid
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
                         (not move?)
                         (dissoc :db/id)))))
                 blocks)))

(defn insert-blocks
  "Insert blocks as children (or siblings) of target-node.
  `blocks` should be sorted already."
  [blocks target-block {:keys [sibling? keep-uuid? move?]}]
  (let [target-block (db/pull (:db/id target-block))
        sibling? (if (:block/name target-block) false sibling?)
        keep-uuid? (if move? true keep-uuid?)
        replace-empty-target? (and sibling?
                                   (string/blank? (:block/content target-block))
                                   (> (count blocks) 1)
                                   (not move?))
        blocks' (blocks-with-level blocks move?)
        tx (insert-blocks-aux blocks' target-block {:sibling? sibling?
                                                    :replace-empty-target? replace-empty-target?
                                                    :keep-uuid? keep-uuid?
                                                    :move? move?})
        uuids-tx (->> (map :block/uuid tx)
                      (remove nil?)
                      (map (fn [uuid] {:block/uuid uuid})))
        tx (if move?
             tx
             (assign-temp-id tx replace-empty-target? target-block))
        target-node (block target-block)
        next (if sibling?
               (tree/-get-right target-node)
               (tree/-get-down target-node))
        next-tx (when (and next (not (contains? (set (map :db/id blocks)) (:db/id (:data next)))))
                  (when-let [left (last (filter (fn [b] (= 1 (:block/level b))) tx))]
                    [{:block/uuid (tree/-get-id next)
                      :block/left (:db/id left)}]))
        full-tx (util/concat-without-nil uuids-tx tx next-tx)]
    (when (and replace-empty-target? (state/editing?))
      (state/set-edit-content! (state/get-edit-input-id) (:block/content (first blocks))))
    {:tx-data full-tx
     :blocks tx}))

(defn- delete-block
  "Delete block from the tree."
  [txs-state blok children?]
  (let [node (block blok)
        right-node (tree/-get-right node)]
    (tree/-del node txs-state children?)
    (when (tree/satisfied-inode? right-node)
      (let [left-node (tree/-get-left node)
            new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
        (tree/-save new-right-node txs-state)))
    @txs-state))

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

(defn delete-blocks
  "Delete blocks from the tree."
  [blocks {:keys [children?]
           :or {children? true}}]
  (let [txs-state (ds/new-outliner-txs-state)
        block-ids (map (fn [b] [:block/uuid (:block/uuid b)]) blocks)
        start-block (first blocks)
        end-block (last (get-top-level-blocks blocks))
        start-node (block start-block)
        end-node (block end-block)
        end-node-parents (->>
                          (db/get-block-parents
                           (state/get-current-repo)
                           (tree/-get-id end-node)
                           1000)
                          (map :block/uuid)
                          (set))
        self-block? (contains? end-node-parents (tree/-get-id start-node))]
    (if (or
         (= 1 (count blocks))
         (= start-node end-node) self-block?)
      (delete-block txs-state start-block children?)
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
          (ds/add-txs txs-state txs))))
    {:tx-data @txs-state}))

(defn get-right-siblings
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (when-let [parent (tree/-get-parent node)]
    (let [children (tree/-get-children parent)]
      (->> (split-with #(not= (tree/-get-id node) (tree/-get-id %)) children)
           last
           rest))))

(defn- build-move-blocks-next-tx
  [blocks]
  (let [id->blocks (zipmap (map :db/id blocks) blocks)
        top-level-blocks (get-top-level-blocks blocks)
        top-level-blocks-ids (set (map :db/id top-level-blocks))
        right-block (get-right-sibling (:db/id (last top-level-blocks)))]
    (when (and right-block
               (not (contains? top-level-blocks-ids (:db/id right-block))))
      {:db/id (:db/id right-block)
       :block/left (loop [block (:block/left right-block)]
                     (if (contains? top-level-blocks-ids (:db/id block))
                       (recur (:block/left (get id->blocks (:db/id block))))
                       (:db/id block)))})))

(defn move-blocks
  [blocks target-block sibling?]
  ;; target is not included in `blocks`
  (when target-block
    (when-not (contains? (set (map :db/id blocks)) (:db/id target-block))
      (let [blocks (if (coll? blocks) blocks [blocks])
            first-block (first blocks)
            {:keys [tx-data]} (insert-blocks blocks target-block {:sibling? sibling?
                                                                  :move? true})
            first-block-page (:db/id (:block/page first-block))
            target-page (:db/id (:block/page target-block))
            not-same-page? (not= first-block-page target-page)
            move-blocks-next-tx [(build-move-blocks-next-tx blocks)]
            full-tx (util/concat-without-nil tx-data move-blocks-next-tx)
            tx-meta (cond-> {:move-blocks (mapv :db/id blocks)
                             :target (:db/id target-block)}
                      not-same-page?
                      (assoc :from-page first-block-page
                             :target-page target-page))]
        {:tx-data full-tx
         :tx-meta tx-meta}))))

(defn move-blocks-up-down
  "Move blocks up/down."
  [blocks up?]
  (let [first-block (db/entity (:db/id (first blocks)))
        first-block-parent (:block/parent first-block)
        left-left (:block/left (:block/left first-block))
        top-level-blocks (get-top-level-blocks blocks)
        last-top-block (last top-level-blocks)
        last-top-block-parent (:block/parent last-top-block)
        right (get-right-sibling (:db/id last-top-block))]
    (cond
      (and up? left-left)
      (cond
        (= (:block/parent left-left) first-block-parent)
        (move-blocks blocks left-left true)

        (= (:db/id left-left) (:db/id first-block-parent))
        (move-blocks blocks left-left false)

        (= (:block/left first-block) first-block-parent)
        (let [target-children (:block/_parent left-left)]
          (if (seq target-children)
            (when (= (:block/parent left-left) (:block/parent first-block-parent))
              (let [target-block (last (db-model/sort-by-left target-children left-left))]
                (move-blocks blocks target-block true)))
            (move-blocks blocks left-left false)))

        :else
        nil)

      (not up?)
      (if right
        (move-blocks blocks right true)
        (when last-top-block-parent
          (when-let [parent-right (get-right-sibling (:db/id last-top-block-parent))]
            (move-blocks blocks parent-right false))))

      :else
      nil)))

(defn page-first-child?
  [block]
  (= (:block/left block)
     (:block/page block)))

(defn indent-outdent-blocks
  [blocks indent?]
  (let [first-block (db/entity (:db/id (first blocks)))
        left (db/entity (:db/id (:block/left first-block)))
        parent (:block/parent first-block)
        db (db/get-conn)
        top-level-blocks (get-top-level-blocks blocks)]
    (if indent?
      (when (and left (not (page-first-child? first-block)))
        (let [last-direct-child-id (db-model/get-block-last-direct-child db (:db/id left))
              blocks' (drop-while (fn [b]
                                    (= (:db/id (:block/parent b))
                                       (:db/id left)))
                                  top-level-blocks)]
          (if (and last-direct-child-id
                   (not (contains? (set (map :db/id top-level-blocks)) last-direct-child-id)))
            (let [last-direct-child (db/entity last-direct-child-id)]
              (move-blocks blocks' last-direct-child true))
            (move-blocks blocks' left false))))
      (when (and parent (not (:block/name (db/entity (:db/id parent)))))
        (let [blocks' (take-while (fn [b]
                                    (not= (:db/id (:block/parent b))
                                          (:db/id (:block/parent parent))))
                                  top-level-blocks)
              result (move-blocks blocks' parent true)]
          (if (state/logical-outdenting?)
            result
            ;; direct outdenting (default behavior)
            (let [last-top-block (db/pull (:db/id (last blocks')))
                  last-top-block-already-outdented? (= (:db/id (:block/parent last-top-block))
                                                       (:db/id (:block/parent parent)))
                  right-siblings (->> (get-right-siblings (block last-top-block))
                                      (map :data))]
              (if (seq right-siblings)
                (let [result2 (if-let [last-direct-child-id (db-model/get-block-last-direct-child db (:db/id last-top-block))]
                                (move-blocks right-siblings (db/entity last-direct-child-id) true)
                                (move-blocks right-siblings last-top-block false))]
                  {:tx-data (util/concat-without-nil (:tx-data result) (:tx-data result2))
                   :tx-meta (:tx-meta result)})
                result))))))))

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
    (conj! *transaction-data* (select-keys result [:tx-data :tx-meta]))
    result))

(defn save-block!
  [block]
  (op-transact! #'save-block block))

(defn insert-blocks!
  [blocks target-block opts]
  (op-transact! #'insert-blocks blocks target-block opts))

(defn delete-blocks!
  [blocks opts]
  (op-transact! #'delete-blocks blocks opts))

(defn move-blocks!
  [blocks target-block sibling?]
  (op-transact! #'move-blocks blocks target-block sibling?))

(defn move-blocks-up-down!
  [blocks up?]
  (op-transact! #'move-blocks-up-down blocks up?))

(defn indent-outdent-blocks!
  [blocks indent?]
  (op-transact! #'indent-outdent-blocks blocks indent?))
