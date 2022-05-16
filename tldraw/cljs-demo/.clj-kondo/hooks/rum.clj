(ns hooks.rum
  (:require [clj-kondo.hooks-api :as api]))

(defn fn-body? [x]
  (and (seq? x)
       (vector? (first x))))

(defn rewrite-body [mixins body defcs?]
  (if defcs?
    (let [[binding-vec & body] (:children body)
          [state-arg & rest-args] (:children binding-vec)
          ;; the original vector without the state argument
          fn-args (assoc binding-vec :children rest-args)
          body (api/list-node
                (list* (api/token-node 'let*)
                       (api/vector-node [state-arg (api/token-node nil)])
                       state-arg
                       (concat mixins body)))
          body (api/list-node [fn-args body])]
      body)
    (let [[binding-vec & body] (:children body)]
      (api/list-node (cons binding-vec (concat mixins body))))))

(defn rewrite
  ([node] (rewrite node false))
  ([node defcs?]
   (let [args (rest (:children node))
         component-name (first args)
         ?docstring (when (string? (api/sexpr (second args)))
                      (second args))
         args (if ?docstring
                (nnext args)
                (next args))
         bodies
         (loop [args* (seq args)
                mixins []
                bodies []]
           (if args*
             (let [a (first args*)
                   a-sexpr (api/sexpr a)]
               (cond (vector? a-sexpr) ;; a-sexpr is a binding vec and the rest is the body of the function
                     [(rewrite-body mixins (api/list-node args*) defcs?)]
                     (fn-body? a-sexpr)
                     (recur (next args*)
                            mixins
                            (conj bodies (rewrite-body mixins a defcs?)))
                     ;; assume mixin
                     :else (recur (next args*)
                                  (conj mixins a)
                                  bodies)))
             bodies))
         new-node (with-meta
                    (api/list-node
                     (list* (api/token-node 'defn)
                            component-name
                            (if ?docstring
                              (cons ?docstring bodies)
                              bodies)))
                    (meta node))]
     new-node)))

(defn defc [{:keys [:node]}]
  (let [new-node (rewrite node)]
    {:node new-node}))

(defn defcs [{:keys [:node]}]
  (let [new-node (rewrite node true)]
    {:node new-node}))
