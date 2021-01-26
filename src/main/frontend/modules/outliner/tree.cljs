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
  (-get-children [this]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

;; tangent-v is node stack '(... node-depth-2 node-depth-1 node-root)
;; direction is either :down or :right
(defrecord Cursor [tangent-v direction])

(defn cursor?
  [cursor]
  (instance? Cursor cursor))

(defn turn-right
  [cursor]
  {:pre [(cursor? cursor)]}
  (assoc cursor :direction :right))

(defn turn-down
  [cursor]
  {:pre [(cursor? cursor)]}
  (assoc cursor :direction :down))

(defn add-node-and-turn-down
  [cursor node]
  {:pre [(cursor? cursor)]}
  (-> (update cursor :tangent-v conj node)
      (turn-down)))

(defn replace-node-and-turn-down
  [cursor node]
  {:pre [(cursor? cursor)]}
  (-> (update cursor :tangent-v (fn [x] (cons node (rest x))))
      (turn-down)))

(defn remove-node-and-turn-right
  [cursor]
  {:pre [(cursor? cursor)]}
  (-> (update cursor :tangent-v rest)
      (turn-right)))

(defn cursor-drained?
  [cursor]
  {:pre [(cursor? cursor)]}
  (not (seq (:tangent-v cursor))))

(defn get-head-&-direction
  [cursor]
  {:pre [(cursor? cursor)]}
  {:head (first (:tangent-v cursor))
   :direction (:direction cursor)})

(defn init-cursor?
  [cursor]
  {:pre [(cursor? cursor)]}
  (= 1 (count (:tangent-v cursor))))

(defn init-cursor
  [root]
  {:pre [(satisfies? INode root)]}
  (->Cursor (list root) :down))

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
    (-save new-right-node)))

(defn move-subtree
  "Move subtree to a destination position in the relation tree.
  Args:
    root: root of subtree
    left-node: left node of destination"
  [root parent-node left-node]
  (let [left-node-id (-get-left-id root)
        right-node (-> (-get-right root)
                       (-set-left-id left-node-id))]
    (-save right-node)
    (if (nil? left-node)
      (insert-node-as-first root parent-node)
      (insert-node-after-first root left-node))))

(defn get-node-list-with-cursor
  "Get node list with cursor.
  Args:
    number(int): the block count of every page.
    cursor(Cursor): current cursor.

  Return:
    acc: list of nodes of current page.
    cursor: current cursor after search."
  [number cursor]
  (letfn [(find [number cursor acc]
            (if (or (cursor-drained? cursor)
                    (neg? number))
              {:cursor cursor :acc acc}
              (let [{:keys [head direction]} (get-head-&-direction cursor)]
                (case direction
                  :down
                  (if-let [node (-get-down head)]
                    (let [cursor (add-node-and-turn-down cursor node)]
                      (find (dec number) cursor (conj acc node)))
                    (let [cursor (turn-right cursor)]
                      (find number cursor acc)))
                  :right
                  (if-let [node (-get-right head)]
                    (let [cursor (replace-node-and-turn-down cursor node)]
                      (find (dec number) cursor (conj acc node)))
                    (let [cursor (remove-node-and-turn-right cursor)]
                      (find number cursor acc)))

                  (throw (js/Error "Unknown direction."))))))]
    (if (init-cursor? cursor)
      (let [root-node (first (:tangent-v cursor))]
        (find (- number 2) cursor [root-node]))
      (find (dec number) cursor []))))