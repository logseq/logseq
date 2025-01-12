(ns logseq.common.defkeywords
  "Macro 'defkeywords' to def keyword with config"
  #?(:cljs (:require-macros [logseq.common.defkeywords])))

(def ^:private *defined-kws (volatile! {}))
(def ^:private *defined-kw->config (volatile! {}))

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
      (vswap! *defined-kws assoc kw current-meta))
    (let [kw->config (partition 2 keyvals)]
      (doseq [[kw config] kw->config]
        (vswap! *defined-kw->config assoc kw config))))
  `(vector ~@keyvals))

(defmacro get-all-defined-kw->config
  []
  `'~(deref *defined-kw->config))
