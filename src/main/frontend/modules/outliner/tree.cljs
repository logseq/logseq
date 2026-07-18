(ns frontend.modules.outliner.tree
  (:require [frontend.util.entity :as entity]
            [logseq.db.common.order :as db-order]
            [logseq.outliner.tree :as otree]))

(defn- block-page
  [block]
  (let [page (:block/page block)]
    (if (number? page) {:db/id page} page)))

(defn- same-root?
  [block root-id]
  (cond
    (uuid? root-id)
    (= (:block/uuid block) root-id)

    (number? root-id)
    (= (:db/id block) root-id)

    (string? root-id)
    (if-let [id (parse-uuid root-id)]
      (= (:block/uuid block) id)
      (or (= (:block/name block) root-id)
          (= (:block/title block) root-id)))

    :else
    (= (:db/id block) (:db/id root-id))))

(defn- root-block
  [blocks root-id]
  (or (some #(when (same-root? % root-id) %) blocks)
      (when-let [page (some block-page blocks)]
        (assoc page :block/uuid (or (:block/uuid page)
                                    (when (uuid? root-id) root-id)
                                    (when (and (string? root-id) (parse-uuid root-id))
                                      (parse-uuid root-id)))))))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  [blocks root-id & {:as option}]
  (let [blocks (map otree/block-entity->map blocks)]
    (if-let [root (root-block blocks root-id)]
      (otree/blocks->vec-tree-data
       blocks root
       {:include-root? (or (not (entity/page? root)) (:link option))
        :keep-block-tx-id? true})
      blocks)))

(defn- entity-key
  [entity]
  (or (:db/id entity) (:block/uuid entity)))

(def ^:private tree-index-key ::tree-index)

(defn- index-aliases
  [index entity key]
  (cond-> index
    (:db/id entity) (assoc-in [:aliases (:db/id entity)] key)
    (:block/uuid entity) (assoc-in [:aliases (:block/uuid entity)] key)))

(defn- index-subtree
  [index entity parent-key]
  (let [key (entity-key entity)
        index (-> index
                  (index-aliases entity key)
                  (assoc-in [:parent-by-key key] parent-key)
                  (assoc-in [:order-by-key key] (:block/order entity)))]
    (reduce #(index-subtree %1 %2 key)
            index
            (:block/children entity))))

(defn index-block-tree
  "Attach a navigation index used to patch a loaded tree without scanning it again."
  [root]
  (when root
    (if (get (meta root) tree-index-key)
      root
      (let [root-key (entity-key root)
            index (index-subtree {:root-key root-key
                                  :aliases {}
                                  :parent-by-key {}
                                  :order-by-key {}}
                                 root
                                 nil)]
        (with-meta root (assoc (meta root) tree-index-key index))))))

(defn- tree-index
  [root]
  (or (get (meta root) tree-index-key)
      (get (meta (index-block-tree root)) tree-index-key)))

(defn- resolve-key
  [index id]
  (or (get-in index [:aliases id])
      (when (map? id)
        (or (get-in index [:aliases (:db/id id)])
            (get-in index [:aliases (:block/uuid id)])))))

(defn- key-chain
  [index key]
  (loop [current key
         result ()]
    (cond
      (nil? current)
      nil

      (= current (:root-key index))
      (vec (cons current result))

      :else
      (recur (get-in index [:parent-by-key current])
             (cons current result)))))

(defn- first-ordered-position
  [children order]
  (loop [low 0
         high (count children)]
    (if (< low high)
      (let [middle (quot (+ low high) 2)
            middle-order (:block/order (nth children middle))]
        (if (neg? (compare middle-order order))
          (recur (inc middle) high)
          (recur low middle)))
      low)))

(defn- child-position
  [children child-key order]
  (loop [position (first-ordered-position children order)]
    (when (< position (count children))
      (let [child (nth children position)
            order-comparison (compare (:block/order child) order)]
        (cond
          (= child-key (entity-key child))
          position

          (pos? order-comparison)
          nil

          :else
          (recur (inc position)))))))

(defn- node-path
  [root index key]
  (when-let [chain (key-chain index key)]
    (loop [parent root
           child-keys (next chain)
           path []]
      (if-let [child-key (first child-keys)]
        (when-let [position (child-position (:block/children parent)
                                            child-key
                                            (get-in index [:order-by-key child-key]))]
          (recur (nth (:block/children parent) position)
                 (next child-keys)
                 (conj path :block/children position)))
        path))))

(defn- node-at
  [root index key]
  (when-let [path (node-path root index key)]
    (get-in root path)))

(defn- assoc-node
  [root index key node]
  (let [path (node-path root index key)]
    (if (seq path)
      (assoc-in root path node)
      node)))

(defn- children-at
  [root index parent-key]
  (:block/children (node-at root index parent-key)))

(defn- assoc-children
  [root index parent-key children]
  (assoc-node root index parent-key
              (assoc (node-at root index parent-key) :block/children children)))

(defn- remove-indexed-subtree
  [index node]
  (let [index (reduce remove-indexed-subtree index (:block/children node))
        key (entity-key node)]
    (cond-> (-> index
                (update :parent-by-key dissoc key)
                (update :order-by-key dissoc key))
      (:db/id node) (update :aliases dissoc (:db/id node))
      (:block/uuid node) (update :aliases dissoc (:block/uuid node)))))

(defn- without-child
  [children child-key order]
  (let [children (vec children)]
    (if-some [position (child-position children child-key order)]
      (into (subvec children 0 position)
            (subvec children (inc position)))
      (throw (ex-info "Indexed child is missing from its parent"
                      {:child-key child-key})))))

(defn- insert-ordered-child
  [children child]
  (let [children (vec children)
        order (:block/order child)
        position (loop [low 0
                        high (count children)]
                   (if (< low high)
                     (let [middle (quot (+ low high) 2)
                           middle-order (:block/order (nth children middle))]
                       (if (pos? (compare middle-order order))
                         (recur low middle)
                         (recur (inc middle) high)))
                     low))]
    (into (conj (subvec children 0 position) child)
          (subvec children position))))

(defn- merge-node-payload
  [node changed]
  (merge node (dissoc changed :block/children :block/level)))

(defn- update-subtree-level
  [node level]
  (assoc node
         :block/level level
         :block/children (mapv #(update-subtree-level % (inc level))
                               (:block/children node))))

(defn- delete-node
  [{:keys [root index] :as state} id]
  (if-let [key (resolve-key index id)]
    (if (= key (:root-key index))
      {:root nil :index index}
      (let [parent-key (get-in index [:parent-by-key key])
            node (node-at root index key)
            children (without-child (children-at root index parent-key)
                                    key
                                    (get-in index [:order-by-key key]))
            root (assoc-children root index parent-key children)
            index (remove-indexed-subtree index node)]
        {:root root :index index}))
    state))

(defn- insert-node
  [{:keys [root index] :as state} changed]
  (if-let [parent-key (resolve-key index (:block/parent changed))]
    (let [parent (node-at root index parent-key)
          node (-> changed
                   (assoc :block/children (vec (:block/children changed)))
                   (update-subtree-level (inc (:block/level parent))))
          children (insert-ordered-child (:block/children parent) node)
          root (assoc-children root index parent-key children)
          index (index-subtree index node parent-key)]
      {:root root :index index})
    state))

(defn- update-existing-node
  [{:keys [root index] :as state} key changed]
  (let [node (node-at root index key)
        old-parent-key (get-in index [:parent-by-key key])
        parent-changed? (contains? changed :block/parent)
        new-parent-key (if parent-changed?
                         (resolve-key index (:block/parent changed))
                         old-parent-key)
        order-changed? (and (contains? changed :block/order)
                            (not= (:block/order node) (:block/order changed)))
        structural? (or (not= old-parent-key new-parent-key) order-changed?)]
    (cond
      (and parent-changed? (nil? new-parent-key))
      (delete-node state key)

      (not structural?)
      {:root (assoc-node root index key (merge-node-payload node changed))
       :index index}

      :else
      (let [old-children (without-child (children-at root index old-parent-key)
                                        key
                                        (get-in index [:order-by-key key]))
            root (assoc-children root index old-parent-key old-children)
            new-parent (node-at root index new-parent-key)
            node (-> node
                     (merge-node-payload changed)
                     (update-subtree-level (inc (:block/level new-parent))))
            new-children (insert-ordered-child (:block/children new-parent) node)
            root (assoc-children root index new-parent-key new-children)
            index (-> index
                      (assoc-in [:parent-by-key key] new-parent-key)
                      (assoc-in [:order-by-key key] (:block/order node)))]
        {:root root :index index}))))

(defn- update-node
  [{:keys [root index] :as state} changed]
  (if-let [key (or (resolve-key index (:db/id changed))
                   (resolve-key index (:block/uuid changed)))]
    (if (= key (:root-key index))
      {:root (merge-node-payload root changed)
       :index index}
      (update-existing-node state key changed))
    (insert-node state changed)))

(defn- optimistic-parent-ref
  [parent]
  (if-let [id (:db/id parent)]
    {:db/id id}
    {:block/uuid (:block/uuid parent)}))

(defn- optimistic-insert-op?
  [[op [blocks _target-id opts]]]
  (and (= :insert-blocks op)
       (= 1 (count blocks))
       (:block/uuid (first blocks))
       (true? (:keep-uuid? opts))
       (boolean? (:sibling? opts))
       (contains? #{nil :insert-blocks} (:outliner-op opts))
       (not-any? #(true? (get opts %))
                 [:bottom? :top? :replace-empty-target? :keep-block-order?
                  :insert-template?])))

(defn- optimistic-op?
  [[op :as op-entry]]
  (case op
    :save-block true
    :delete-blocks true
    :insert-blocks (optimistic-insert-op? op-entry)
    false))

(defn optimistic-ops-supported?
  [ops]
  (and (seq ops)
       (some #(contains? #{:insert-blocks :delete-blocks} (first %)) ops)
       (every? optimistic-op? ops)))

(defn- optimistic-op-resolvable?
  [index [op args]]
  (case op
    :save-block
    (some? (resolve-key index (:block/uuid (first args))))

    :delete-blocks
    (every? #(some? (resolve-key index %)) (first args))

    :insert-blocks
    (let [[blocks target-id] args]
      (and (some? (resolve-key index target-id))
           (nil? (resolve-key index (:block/uuid (first blocks))))))

    false))

(defn- optimistic-insert-node
  [{:keys [root index] :as state} [blocks target-id opts]]
  (let [target-key (resolve-key index target-id)
        target (node-at root index target-key)
        sibling? (:sibling? opts)
        parent-key (if sibling?
                     (get-in index [:parent-by-key target-key])
                     target-key)
        parent (node-at root index parent-key)
        children (vec (:block/children parent))
        target-position (when sibling?
                          (child-position children target-key (:block/order target)))
        start-order (when sibling? (:block/order target))
        end-order (if sibling?
                    (:block/order (get children (inc target-position)))
                    (:block/order (first children)))
        order (first (db-order/gen-n-keys 1 start-order end-order
                                          :max-key-atom (atom nil)))
        block (-> (first blocks)
                  (assoc :block/parent (optimistic-parent-ref parent)
                         :block/order order))]
    (insert-node state block)))

(defn- apply-optimistic-op
  [state [op args]]
  (case op
    :save-block
    (update-node state (first args))

    :delete-blocks
    (reduce delete-node state (first args))

    :insert-blocks
    (optimistic-insert-node state args)))

(defn apply-optimistic-ops
  "Apply a small editor transaction to a loaded tree before worker confirmation.

  Returns nil when every operation cannot be reproduced exactly from the loaded
  structure. Complex structural operations stay on the authoritative worker path."
  [root ops]
  (when (and root
             (optimistic-ops-supported? ops))
    (let [root (index-block-tree root)
          index (tree-index root)]
      (when (every? #(optimistic-op-resolvable? index %) ops)
        (let [{:keys [root index]}
              (reduce apply-optimistic-op {:root root :index index} ops)]
          (with-meta root (assoc (meta root) tree-index-key index)))))))

(defn reconcile-block-tree
  "Apply changed and deleted entities to a loaded block tree.

  Content updates rebuild one ancestor path. Structural updates only rebuild the
  affected sibling lists and a moved or deleted subtree."
  [root changed-entities deleted-ids]
  (if (or (nil? root)
          (and (empty? changed-entities) (empty? deleted-ids)))
    root
    (let [index (tree-index root)
          {:keys [root index]}
          (reduce delete-node {:root root :index index} deleted-ids)
          {:keys [root index]}
          (reduce update-node {:root root :index index} changed-entities)]
      (when root
        (with-meta root (assoc (meta root) tree-index-key index))))))

(defn- replay-optimistic-ops
  [base-root pending]
  (reduce (fn [root {:keys [ops]}]
            (or (apply-optimistic-ops root ops) root))
          base-root
          pending))

(defn apply-loaded-tree-event
  "Apply one renderer tree event and retain pending deltas for confirmation or rollback."
  [root optimistic-state event]
  (let [base-root (or (:base-root optimistic-state) root)
        pending (vec (:pending optimistic-state))]
    (cond
      (:optimistic-ops event)
      (let [current-root (replay-optimistic-ops base-root pending)
            root' (apply-optimistic-ops current-root (:optimistic-ops event))]
        (if root'
          (let [pending' (conj pending {:tx-id (:optimistic-tx-id event)
                                        :ops (:optimistic-ops event)})]
            {:root root'
             :optimistic-state {:base-root base-root
                                :pending pending'}})
          {:root root
           :optimistic-state optimistic-state}))

      (:rollback-optimistic-tx-id event)
      (let [tx-id (:rollback-optimistic-tx-id event)
            pending' (filterv #(not= tx-id (:tx-id %)) pending)
            root' (replay-optimistic-ops base-root pending')]
        {:root root'
         :optimistic-state (when (seq pending')
                             {:base-root base-root
                              :pending pending'})})

      :else
      (let [base-root' (reconcile-block-tree base-root
                                             (:updated-blocks event)
                                             (:deleted-ids event))
            confirmed-tx-id (:confirmed-optimistic-tx-id event)
            pending' (if confirmed-tx-id
                       (filterv #(not= confirmed-tx-id (:tx-id %)) pending)
                       pending)
            root' (replay-optimistic-ops base-root' pending')]
        {:root root'
         :optimistic-state (when (seq pending')
                             {:base-root base-root'
                              :pending pending'})}))))

(defonce ^:private *resident-block-trees (atom {}))
(defonce ^:private *resident-block-tree-order (atom []))

(defn- assoc-root-aliases
  [trees root]
  (cond-> trees
    (:db/id root) (assoc (:db/id root) root)
    (:block/uuid root) (assoc (:block/uuid root) root)))

(defn resident-block-tree
  [id]
  (get @*resident-block-trees id))

(defn keep-block-tree-resident!
  [root]
  (when root
    (let [root-key (entity-key root)
          order (swap! *resident-block-tree-order
                       (fn [keys]
                         (->> (concat (remove #{root-key} keys) [root-key])
                              (take-last 2)
                              vec)))
          roots-by-key (assoc (into {}
                                    (map (juxt entity-key identity))
                                    (vals @*resident-block-trees))
                              root-key root)]
      (reset! *resident-block-trees
              (reduce (fn [trees key]
                        (if-let [resident-root (get roots-by-key key)]
                          (assoc-root-aliases trees resident-root)
                          trees))
                      {}
                      order))))
  root)

(defn reconcile-resident-block-trees!
  [changed-entities deleted-ids]
  (swap! *resident-block-trees
         (fn [trees]
           (reduce (fn [result root]
                     (let [root' (reconcile-block-tree root changed-entities deleted-ids)]
                       (if root'
                         (assoc-root-aliases result root')
                         result)))
                   {}
                   (vals (into {} (map (juxt entity-key identity)) (vals trees))))))
  nil)

(def filter-top-level-blocks otree/filter-top-level-blocks)

(def non-consecutive-blocks->vec-tree otree/non-consecutive-blocks->vec-tree)

(defn get-sorted-block-and-children
  [db db-id & {:as opts}]
  (otree/get-sorted-block-and-children db db-id opts))
