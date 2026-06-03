(ns hooks.defevent
  (:require [clj-kondo.hooks-api :as api]))

(defn defevent
  [{:keys [node]}]
  (let [[_ event-id args & body] (:children node)
        args (if (empty? (api/sexpr args))
               (api/vector-node [(api/token-node '_event)])
               args)
        new-node (api/list-node
                  [(api/token-node 'frontend.handler.events/register-event-definition!)
                   event-id
                   (api/list-node
                    (concat [(api/token-node 'fn) args] body))])]
    {:node (with-meta new-node (meta node))}))
