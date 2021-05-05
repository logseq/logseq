(ns frontend.modules.outliner.tree
  (:require [clojure.set :as set]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.debug :as debug]
            [frontend.util :as util]
            [frontend.db :as db]))

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

  (-save [this db])
  (-del [this db children?])
  (-get-children [this]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

(defn- get-children
  [blocks parent]
  (let [children (doall
                  (-> (filter #(= (:block/parent %) {:db/id (:db/id parent)}) @blocks)
                      (db/sort-by-left parent)))]
    (reset! blocks (remove (set children) @blocks))
    children))

(defn- with-children-and-refs
  [block children]
  (let [all-refs (->> (mapcat :block/refs children)
                      (distinct))]
    (assoc block
           :block/children children
           :block/refs-with-children all-refs)))

(defn- blocks->vec-tree-aux
  [blocks root]
  (some->>
   (get-children blocks root)
   (map (fn [block]
          (let [children (blocks->vec-tree-aux blocks block)]
            (with-children-and-refs block children))))))

(defn- get-root-and-page
  [root-id]
  (if (string? root-id)
    (if (util/uuid-string? root-id)
      [false (db/entity [:block/uuid (uuid root-id)])]
      [true (or (db/entity [:block/name root-id])
                (db/entity [:block/original-name root-id]))])
    [false root-id]))

(defn blocks->vec-tree
  [blocks root-id]
  (let [original-blocks blocks
        blocks (atom blocks)
        [page? root] (get-root-and-page (str root-id))
        result (blocks->vec-tree-aux blocks root)]
    (cond
      (not root)                        ; custom query
      original-blocks

      page?
      result

      :else                             ; include root block
      (let [root-block (some #(when (= (:db/id %) (:db/id root)) %) @blocks)
            root-block (with-children-and-refs root-block result)]
        [root-block]))))
