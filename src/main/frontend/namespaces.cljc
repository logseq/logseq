(ns ^:no-doc frontend.namespaces
  #?(:cljs (:require-macros [frontend.namespaces])))

;; copy from https://github.com/clj-commons/potemkin/issues/31#issuecomment-110689951
(defmacro import-def
  "import a single fn or var
   (import-def a b) => (def b a/b)
  "
  [from-ns def-name]
  (let [from-sym# (symbol (str from-ns) (str def-name))]
    `(def ~def-name ~from-sym#)))

(defmacro import-vars
  "import multiple defs from multiple namespaces
   works for vars and fns. not macros.
   (same syntax as potemkin.namespaces/import-vars)
   (import-vars
     [m.n.ns1 a b]
     [x.y.ns2 d e f]) =>
   (def a m.n.ns1/a)
   (def b m.n.ns1/b)
    ...
   (def d m.n.ns2/d)
    ... etc
  "
  [& imports]
  (let [expanded-imports (for [[from-ns & defs] imports
                               d defs]
                           `(import-def ~from-ns ~d))]
    `(do ~@expanded-imports)))

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
