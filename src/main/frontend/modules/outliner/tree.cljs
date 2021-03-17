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

(defn insert-node-as-first-child
  "Insert a node as first child."
  [new-node parent-node]
  (:pre [(every? satisfied-inode? [new-node parent-node])])
  (let [parent-id (-get-id parent-node)
        node (-> (-set-left-id new-node parent-id)
               (-set-parent-id parent-id))
        right-node (-get-down parent-node)]
    (if (satisfied-inode? right-node)
      (let [new-right-node (-set-left-id right-node (-get-id new-node))]
        (-save node)
        (-save new-right-node))
      (-save node))))

(defn insert-node-as-sibling
  "Insert a node as sibling."
  [new-node left-node]
  (:pre [(every? satisfied-inode? [new-node left-node])])
  (let [node (-> (-set-left-id new-node (-get-id left-node))
               (-set-parent-id (-get-parent-id left-node)))
        right-node (-get-right left-node)]
    (if (satisfied-inode? right-node)
      (let [new-right-node (-set-left-id right-node (-get-id new-node))]
        (-save node)
        (-save new-right-node))
      (-save node))))

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
  {:pre [(every? satisfied-inode? [root parent-node])
         (or
           (satisfied-inode? left-node)
           (nil? left-node))]}
  (let [left-node-id (-get-left-id root)]
    (if (nil? left-node)
      (insert-node-as-first-child root parent-node)
      (insert-node-as-sibling root left-node))
    (let [right-node (-get-right root)]
      (when (satisfied-inode? right-node)
        (let [new-right-node (-set-left-id right-node left-node-id)]
         (-save new-right-node))))))
