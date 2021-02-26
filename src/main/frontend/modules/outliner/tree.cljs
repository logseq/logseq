(ns frontend.modules.outliner.tree)

(defprotocol INode
  (-get-id [this])
  (-get-parent-id [this])
  (-set-parent-id [this parent-id])
  (-get-left-id [this])
  (-set-left-id [this left-id])

  (-get-parent [this])
  (-get-left [this])
  (-get-right [this])
  (-get-down [this])

  (-save [this])
  (-del [this])
  (-get-children [this]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

(defn insert-node-as-first
  "Insert a node as first child of its parent."
  [new-node parent-node]
  (:pre [(every? satisfied-inode? [new-node parent-node])])
  (let [right-node (-get-down parent-node)
        parent-id (-get-id parent-node)
        new-right-node (-set-left-id right-node (-get-id new-node))
        node (-> (-set-left-id new-node parent-id)
                 (-set-parent-id parent-id))]
    (-save node)
    (-save new-right-node)))

(defn insert-node-after-first
  "Insert a node after first child of its parent."
  [new-node left-node]
  (:pre [(every? satisfied-inode? [new-node left-node])])
  (let [right-node (-get-right left-node)
        new-right-node (-set-left-id right-node (-get-id new-node))
        node (-> (-set-left-id new-node (-get-id left-node))
                 (-set-parent-id (-get-parent-id left-node)))]
    (-save node)
    (-save new-right-node)))

(defn delete-node
  "Delete node from the tree."
  [node]
  {:pre [(satisfied-inode? node)]}
  (let [right-node (-get-right node)
        left-node (-get-left node)
        new-right-node (-set-left-id right-node (-get-id left-node))]
    (-del node)
    (-save new-right-node)))

(defn move-subtree
  "Move subtree to a destination position in the relation tree.
  Args:
    root: root of subtree
    left-node: left node of destination"
  [root parent-node left-node]
  {:pre [(every? satisfied-inode? [root parent-node left-node])]}
  (let [left-node-id (-get-left-id root)
        right-node (-> (-get-right root)
                       (-set-left-id left-node-id))]
    (-save right-node)
    (if (nil? left-node)
      (insert-node-as-first root parent-node)
      (insert-node-after-first root left-node))))

(defn render-react-tree
  [init-node node-number
   {:keys [single-node-render
           parent-&-children-render
           sibling-nodes-render]
    :as _renders}]
  (let [number (atom (dec node-number))]
    (letfn [(render [node children]
              (let [node-tree (let [down (-get-down node)]
                                (if (and (satisfied-inode? down)
                                         (pos? @number))
                                  (do (swap! number dec)
                                      (parent-&-children-render node (render down nil)))
                                  (single-node-render node)))
                    right (-get-right node)]
                (let [new-children (sibling-nodes-render children node-tree)]
                  (if (and (satisfied-inode? right)
                           (pos? @number))
                    (do (swap! number dec)
                        (render right new-children))
                    new-children))))]
      (render init-node nil))))
