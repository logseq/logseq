(ns frontend.modules.outliner.tree
  (:require [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [frontend.util :as util]
            [datascript.impl.entity :as e]))

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

(defrecord Block [data])

(defn get-block-from-db
  ([id]
   (let [c (conn/get-outliner-conn)
         r (db-outliner/get-by-id c id)]
     (when r (->Block r))))
  ([parent-id left-id]
   (let [c (conn/get-outliner-conn)
         r (db-outliner/get-by-parent-&-left c parent-id left-id)]
     (when r (->Block r)))))

(defn ensure-ident-form
  [id]
  (cond
    (or (e/entity? id) (map? id))
    (:db/id id)

    (vector? id)
    id

    :else
    nil))

(extend-type Block
  INode
  (-get-id [this]
    (if-let [id (get-in this [:data :db/id])]
      id
      (if-let [block-id (get-in this [:data :block/id])]
        [:block/id block-id]
        (throw (js/Error (util/format "Cant find id: %s" this))))))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent-id])
        (ensure-ident-form)))

  (-set-parent-id [this parent-id]
    (update this :data assoc :block/parent-id parent-id))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left-id])
        (ensure-ident-form)))

  (-set-left-id [this left-id]
    (update this :data assoc :block/left-id left-id))

  (-get-parent [this]
    (let [parent-id (-get-parent-id this)]
      (get-block-from-db parent-id)))

  (-get-left [this]
    (let [left-id (-get-left-id this)]
      (get-block-from-db left-id)))

  (-get-right [this]
    (let [left-id (-get-id this)
          parent-id (-get-parent-id this)]
      (get-block-from-db parent-id left-id)))

  (-get-down [this]
    (let [parent-id (-get-id this)]
      (get-block-from-db parent-id parent-id)))

  (-save [this]
    (let [conn (conn/get-outliner-conn)]
      (db-outliner/save-block conn (:data this))))

  (-del [this]
    (let [conn (conn/get-outliner-conn)]
      (->> (-get-id this)
           (db-outliner/del-block conn))))

  (-get-children [this]
    (let [first-child (-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (-get-right current)]
          (recur node (conj children node))
          children)))))

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
    (-del node)
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

(defn render-react-tree
  [init-node node-number
   {:keys [single-node-render
           parent-&-children-render
           sibling-nodes-render]
    :as renders}]
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

