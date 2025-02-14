(ns ^:no-doc frontend.handler.profiler)

(defmacro arity-n-fn
  [n f-sym]
  (let [arg-seq (mapv #(symbol (str "x" %)) (range n))]
    (vec
     (for [i (range n)]
       (let [arg-seq* (vec (take i arg-seq))]
         `(~'fn ~arg-seq* (apply ~f-sym ~arg-seq*)))))))
