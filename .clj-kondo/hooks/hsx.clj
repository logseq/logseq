(ns hooks.hsx
  (:require [clj-kondo.hooks-api :as api]))

(defn fn-body? [x]
  (and (seq? x)
       (vector? (first x))))

(defn rewrite-body [body]
  (let [[binding-vec & body] (:children body)]
    (api/list-node (cons binding-vec body))))

(defn rewrite
  [node]
  (let [args (rest (:children node))
        component-name (first args)
        ?docstring (when (string? (api/sexpr (second args)))
                     (second args))
        args (if ?docstring
               (nnext args)
               (next args))
        bodies
        (loop [args* (seq args)
               bodies []]
          (if args*
            (let [a (first args*)
                  a-sexpr (api/sexpr a)]
              (cond
                (vector? a-sexpr)
                [(rewrite-body (api/list-node args*))]

                (fn-body? a-sexpr)
                (recur (next args*) (conj bodies (rewrite-body a)))

                :else
                (recur (next args*) bodies)))
            bodies))
        new-node (with-meta
                   (api/list-node
                    (list* (api/token-node 'defn)
                           component-name
                           (if ?docstring
                             (cons ?docstring bodies)
                             bodies)))
                   (meta node))]
    new-node))

(defn defc [{:keys [:node]}]
  {:node (rewrite node)})
