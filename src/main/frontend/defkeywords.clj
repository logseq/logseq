(ns frontend.defkeywords
  "Compile-time keyword ownership checks for frontend ClojureScript namespaces.")

(def ^:private *defined-keywords (volatile! {}))

(defmacro defkeyword
  "Marks one keyword definition for editor and lint tooling."
  [& _args])

(defmacro defkeywords
  "Returns keyword/config pairs and rejects ownership duplicated across source files."
  [& keyvals]
  (let [keywords (take-nth 2 keyvals)
        current-meta (meta &form)]
    (doseq [keyword-value keywords]
      (when-let [info (get @*defined-keywords keyword-value)]
        (when (not= (:file current-meta) (:file info))
          (vswap! *defined-keywords assoc keyword-value current-meta)
          (throw (ex-info "keyword already defined somewhere else"
                          {:kw keyword-value :info info}))))
      (vswap! *defined-keywords assoc keyword-value current-meta)))
  `(vector ~@keyvals))
