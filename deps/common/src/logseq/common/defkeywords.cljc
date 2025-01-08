(ns logseq.common.defkeywords
  "Macro 'defkeywords' to def keyword with docstring"
  #?(:cljs (:require-macros [logseq.common.defkeywords])))

#?(:clj (def ^:private *defined-kws (volatile! {})))

#_:clj-kondo/ignore
(defmacro defkeyword
  "Define keyword with docstring.
  How 'find keyword definition' works?
  clojure-lsp treat keywords defined by `cljs.spec.alpha/def` as keyword-definition.
  Adding a :lint-as `defkeyword` -> `cljs.spec.alpha/def` in clj-kondo config make it works."
  [& _args])

(defmacro defkeywords
  "impl at hooks.defkeywords in .clj-kondo
(defkeywords ::a <config-map> ::b <config-map>)"
  [& keyvals]
  (let [kws (take-nth 2 keyvals)
        current-meta (meta &form)]
    (doseq [kw kws]
      (when-let [info (get @*defined-kws kw)]
        (when (not= (:file current-meta) (:file info))
          (vswap! *defined-kws assoc kw current-meta)
          (throw (ex-info "keyword already defined somewhere else" {:kw kw :info info}))))
      (vswap! *defined-kws assoc kw current-meta)))
  `(vector ~@keyvals))
