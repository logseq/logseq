(ns dev)


(comment

 ;; In dict to get unequal counts
 (->> (dissoc dicts :tongue/fallback) (map (fn [[k v]] [k (count v)])) (sort-by second >))

 (def q #queue [1 2 3])
 (pop q)

 ;; Current repos
 (require '[frontend.state :as state])
 (state/sub [:me :repos])

;; Debugging in query-dsl-test
 (let [db (frontend.db.conn/get-conn test-db)]
   (prn :DB (datascript.core/q '[:find (pull ?b [*]) :where [?b :block/properties ?prop] [(get ?prop :prop-num)]]
                               db)))
 )
