(ns shadow.build-large-graph)

(comment

  (in-ns 'frontend.db-worker)
  (def repo "logseq_db_large-db-demo")
  (def conn (worker-state/get-datascript-conn repo))

  (defonce *ids (atom (set (map :v (d/datoms @conn :avet :block/uuid)))))
  (defn get-next-id
    []
    (let [id (random-uuid)]
      (if (@*ids id)
        (get-next-id)
        (do
          (swap! *ids conj id)
          id))))

  (defn pages
    [start-idx n]
    (let [ids (repeatedly n get-next-id)]
      (map-indexed
       (fn [idx id]
         {:block/uuid id
          :block/original-name (str "page-" (+ start-idx idx))
          :block/name (str "page-" (+ start-idx idx))
          :block/format :markdown})
       ids)))

  (defn blocks
    [page-id size]
    (let [page-id [:block/uuid page-id]
          blocks (vec (repeatedly size (fn []
                                         (let [id (get-next-id)]
                                           {:block/uuid id
                                            :block/content (str id)
                                            :block/format :markdown
                                            :block/page page-id
                                            :block/parent page-id}))))]
      (map-indexed
       (fn [i b]
         (if (zero? i)
           (assoc b :block/left page-id)
           (let [left (nth blocks (dec i))]
             (assoc b :block/left [:block/uuid (:block/uuid left)]))))
       blocks)))

  (defn create-graph!
    [conn page-size blocks-size start-idx]
    (let [pages (pages start-idx page-size)
          page-blocks (map (fn [p]
                             (cons p
                                   (blocks (:block/uuid p) blocks-size))) pages)]
      (doseq [data (partition-all 1000 page-blocks)]
        (let [tx-data (apply concat data)]
          (prn :debug :progressing (:block/name (first tx-data)))
          (d/transact! conn tx-data {:new-graph? true})))))

  (create-graph! conn 30000 20 0))
