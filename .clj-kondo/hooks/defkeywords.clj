(ns hooks.defkeywords
  (:require [clj-kondo.hooks-api :as api]))

(defn defkeywords
  [{:keys [node]}]
  (let [[_ & keyvals] (:children node)
        kw->v (partition 2 keyvals)
        kws (map first kw->v)]
    (cond
      (odd? (count keyvals))
      (api/reg-finding!
       (assoc (meta node)
              :message "Require even number of args"
              :type :defkeywords/invalid-arg))
      (not (every? (comp qualified-keyword? api/sexpr) kws))
      (api/reg-finding!
       (assoc (meta node)
              :message "Should use qualified-keywords"
              :type :defkeywords/invalid-arg))
      :else
      (let [new-node (api/list-node
                      (map (fn [[kw v]]
                             (api/list-node
                              [(api/token-node 'logseq.common.defkeywords/defkeyword) kw v]))
                           kw->v))]
        {:node (with-meta new-node
                 (meta node))}))))
