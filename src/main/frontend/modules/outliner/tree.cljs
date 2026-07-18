(ns frontend.modules.outliner.tree
  (:require [frontend.util.entity :as entity]
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
                  (assoc-in [:parent-by-key key] parent-key))]
    (reduce-kv
     (fn [result position child]
       (-> result
           (assoc-in [:child-position key (entity-key child)] position)
           (index-subtree child key)))
     index
     (vec (:block/children entity)))))

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
                                  :child-position {}}
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

(defn- node-path
  [index key]
  (when-let [chain (key-chain index key)]
    (loop [parent-key (first chain)
           child-keys (next chain)
           path []]
      (if-let [child-key (first child-keys)]
        (when-let [position (get-in index [:child-position parent-key child-key])]
          (recur child-key
                 (next child-keys)
                 (conj path :block/children position)))
        path))))

(defn- node-at
  [root index key]
  (when-let [path (node-path index key)]
    (get-in root path)))

(defn- assoc-node
  [root index key node]
  (let [path (node-path index key)]
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

(defn- reindex-children
  [index parent-key children]
  (reduce-kv
   (fn [result position child]
     (let [key (entity-key child)]
       (-> result
           (assoc-in [:parent-by-key key] parent-key)
           (assoc-in [:child-position parent-key key] position))))
   (assoc-in index [:child-position parent-key] {})
   children))

(defn- remove-indexed-subtree
  [index node]
  (let [index (reduce remove-indexed-subtree index (:block/children node))
        key (entity-key node)]
    (cond-> (-> index
                (update :parent-by-key dissoc key)
                (update :child-position dissoc key))
      (:db/id node) (update :aliases dissoc (:db/id node))
      (:block/uuid node) (update :aliases dissoc (:block/uuid node)))))

(defn- without-child
  [children child-key]
  (into [] (remove #(= child-key (entity-key %))) children))

(defn- sorted-with-child
  [children child]
  (->> (conj (vec children) child)
       (sort-by :block/order)
       vec))

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
            children (without-child (children-at root index parent-key) key)
            root (assoc-children root index parent-key children)
            index (-> index
                      (remove-indexed-subtree node)
                      (reindex-children parent-key children))]
        {:root root :index index}))
    state))

(defn- insert-node
  [{:keys [root index] :as state} changed]
  (if-let [parent-key (resolve-key index (:block/parent changed))]
    (let [parent (node-at root index parent-key)
          node (-> changed
                   (assoc :block/children (vec (:block/children changed)))
                   (update-subtree-level (inc (:block/level parent))))
          children (sorted-with-child (:block/children parent) node)
          root (assoc-children root index parent-key children)
          index (-> index
                    (index-subtree node parent-key)
                    (reindex-children parent-key children))]
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
      (let [old-children (without-child (children-at root index old-parent-key) key)
            root (assoc-children root index old-parent-key old-children)
            index (reindex-children index old-parent-key old-children)
            new-parent (node-at root index new-parent-key)
            node (-> node
                     (merge-node-payload changed)
                     (update-subtree-level (inc (:block/level new-parent))))
            new-children (sorted-with-child (:block/children new-parent) node)
            root (assoc-children root index new-parent-key new-children)
            index (-> index
                      (assoc-in [:parent-by-key key] new-parent-key)
                      (reindex-children new-parent-key new-children))]
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
