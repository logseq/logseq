(ns frontend.util.property-edit
  "Macros.")

(defmacro defn-when-file-based
  [fname args]
  (let [fn-name (symbol (str fname "-when-file-based"))
        other-args (gensym "args")
        fn-args (vector 'repo '& other-args)
        call-fn-name (symbol (str "frontend.util.property/" fname))]
    `(~'defn
      ~fn-name
      ~(str "when repo is db-based-graph, just return the original content.
see also `" call-fn-name "`")
      ~fn-args
      (let [~args ~other-args]
        (if (frontend.config/db-based-graph? ~'repo)
          ~'content
          (apply ~call-fn-name ~other-args))))))
