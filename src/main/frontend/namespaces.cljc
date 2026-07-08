(ns ^:no-doc frontend.namespaces
  #?(:cljs (:require-macros [frontend.namespaces])))

;; FIXME:
#_(defmacro import-ns
  "import all the public defs from multiple namespaces
   works for vars and fns. not macros.
  (import-ns
     m.n.ns1
     x.y.ns2) =>
   (def a m.n.ns1/a)
   (def b m.n.ns1/b)
    ...
   (def d m.n.ns2/d)
    ... etc
  "
  [& namespaces]
  (let [expanded-imports (for [from-ns namespaces
                               d ((ns-resolve 'cljs.analyzer.api 'ns-publics) from-ns)]
                           `(import-def ~from-ns ~d))]
    `(do ~@expanded-imports)))
