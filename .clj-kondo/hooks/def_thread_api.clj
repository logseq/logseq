(ns hooks.def-thread-api
  (:require [clj-kondo.hooks-api :as api]))

(defn def-thread-api
  [{:keys [node]}]
  (let [[_ kw & others] (:children node)
        new-node (api/list-node
                  [(api/token-node 'do)
                   (api/list-node [(api/token-node 'frontend.common.thread-api/defkeyword) kw])
                   (api/list-node
                    (cons (api/token-node 'fn) others))])
        new-node* (with-meta new-node (meta node))]
    {:node new-node*}))
