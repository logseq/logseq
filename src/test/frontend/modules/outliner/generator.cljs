(ns frontend.modules.outliner.generator
  (:require [nano-id.core :as nano]
            [frontend.modules.outliner.core-test :as tt]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.tree :as tree]
            [datascript.core :as d]))


(defn generate-parent-relation
  [number root-id]
  (let [node-seq (repeatedly number nano/nano-id)
        root {:id root-id}
        parent-coll (atom [root])]
    (doseq [n node-seq]
      (let [size (count @parent-coll)
            parent-id (->> (dec size)
                        (rand-int)
                        (get @parent-coll)
                        :id)
            new-node {:id n :parent parent-id}]
        (swap! parent-coll conj new-node)))
    @parent-coll))

(defn generate-tree-node
  [node-id parent-relation]
  (let [children-record (filter #(= (:parent %) node-id) parent-relation)]
    (if (seq children-record)
      (let [rest-parent-relation
            (remove #(= (:parent %) node-id) parent-relation)
            children
            (keep #(generate-tree-node (:id %) rest-parent-relation) children-record)]
        {:id node-id :children children})
      {:id node-id :children nil})))

(defn generate-random-tree
  [node-num]
  (let [root-id "2"]
    (->>
      (generate-parent-relation node-num root-id)
      (generate-tree-node root-id)
      (tt/build-db-records))))

(defn generate-random-block
  [num]
  (dotimes [i num]
    (prn i)
    (let [block (tt/build-block (nano/nano-id))]
      (tree/-save block))))

(comment
  (let [fresh-db (conn/create-outliner-db)]
    (reset! conn/outliner-db @fresh-db)
    (generate-random-tree 10))

  conn/outliner-db

  (generate-random-block 10e4)

  (generate-random-tree 10)

  (d/q '[:find (count ?id) .
         :where
         [?e :block/id ?id]]
    @conn/outliner-db)

  )