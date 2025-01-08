(ns logseq.common.defkeywords
  "Macro 'defkeywords' to def keyword with docstring"
  #?(:cljs (:require-macros [logseq.common.defkeywords])))

#_:clj-kondo/ignore
(defmacro defkeyword
  "Define keyword with docstring.
  How 'find keyword definition' works?
  clojure-lsp treat keywords defined by `cljs.spec.alpha/def` as keyword-definition.
  Adding a :lint-as `defkeyword` -> `cljs.spec.alpha/def` in clj-kondo config make it works."
  [kw docstring & _args]
  (assert (keyword? kw) "must be keyword")
  (assert (some? docstring) "must have 'docstring' arg"))

(defmacro defkeywords
  "impl at hooks.defkeywords in .clj-kondo
(defkeywords ::a <config-map> ::b <config-map>)"
  [& keyvals]
  `(vector ~@keyvals))
