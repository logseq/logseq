(ns logseq.tasks.rewrite-clj
  "Rewrite-clj fns"
  (:require [rewrite-clj.zip :as z]))

(defn- find-symbol-value-sexpr
  ([zloc sym] (find-symbol-value-sexpr zloc sym z/right))
  ([zloc sym nav-fn]
   ;; Returns first symbol found
   (-> (z/find-value zloc z/next sym)
       nav-fn
       z/sexpr)))

(defn var-sexp
  "Returns value sexp to the right of var"
  [file string-var]
  (let [zloc (z/of-string (slurp file))
        sexp (find-symbol-value-sexpr zloc (symbol string-var))]
    (or sexp
        (throw (ex-info "var-sexp must not return nil" {:file file :string-var string-var})))))

(defn metadata-var-sexp
  "Returns value sexp to the right of var with metadata"
  [file string-var]
  (let [zloc (z/of-string (slurp file))
        sexp (find-symbol-value-sexpr zloc (symbol string-var) (comp z/right z/up))]
    (or sexp
        (throw (ex-info "sexp must not return nil" {:file file :string-var string-var})))))
