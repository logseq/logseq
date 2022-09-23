(ns frontend.debug
  "Macros that are useful for debugging"
  (:refer-clojure :rename {defn core-defn}))

(defmacro defn [name & fdecl]
  (let [fdecl (if (string? (first fdecl))
                (next fdecl)
                fdecl)
        fdecl (if (map? (first fdecl))
                (next fdecl)
                fdecl)
        fdecl (if (vector? (first fdecl))
                (list fdecl)
                fdecl)
        fdecl (if (map? (last fdecl))
                (butlast fdecl)
                fdecl)
        fdecl (map (fn [decl]
                     (let [params (first decl)
                           body (next decl)]
                       `(~params
                         (let [start# (cljs.core/system-time)
                               ret# (do ~@body)
                               elapsed# (.toFixed (- (cljs.core/system-time) start#) 6)]
                           (println (str "[" '~name "] " elapsed# " msecs"))
                           ret#)))) fdecl)]
    `(core-defn ~@(cons name fdecl))))
