(ns logseq.db-sync.worker.timing)

(defn summary
  "Returns duration summary from `start-ms` to `end-ms` with ordered `steps`.

  `steps` is a vector of `[label ms]` pairs where each `ms` is an absolute
  timestamp in milliseconds."
  [start-ms steps end-ms]
  (let [steps (or steps [])
        result (reduce (fn [{:keys [prev entries]} [label ms]]
                         {:prev ms
                          :entries (conj entries {:label label
                                                  :ms (- ms prev)})})
                       {:prev start-ms :entries []}
                       steps)
        last-ms (:prev result)
        tail-ms (- end-ms last-ms)]
    {:total-ms (- end-ms start-ms)
     :steps (:entries result)
     :tail-ms tail-ms}))
