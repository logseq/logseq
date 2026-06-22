(ns frontend.db.hooks
  "Hooks for DB-backed React integration."
  (:require [frontend.db.react :as react]
            [logseq.shui.hooks :as hooks]))

(defn use-query
  "Subscribe to a DB reactive query atom returned by `frontend.db.react/q`."
  [query-ref]
  (let [[value set-value!] (hooks/use-state (when query-ref @query-ref))
        [_render-token set-render-token!] (hooks/use-state 0)
        render-token-ref (hooks/use-ref 0)
        component-ref (hooks/use-ref nil)
        query-key (react/query-key query-ref)]
    (when-not (hooks/deref component-ref)
      (hooks/set-ref! component-ref
                      (fn []
                        (let [next-token (inc (hooks/deref render-token-ref))]
                          (hooks/set-ref! render-token-ref next-token)
                          (set-render-token! next-token)))))
    (hooks/use-effect!
     (fn []
       (when query-key
         (react/add-query-component! query-key (hooks/deref component-ref)))
       #(react/remove-query-component! (hooks/deref component-ref)))
     [query-key])
    (hooks/use-effect!
     (fn []
       (if query-ref
         (let [current-value @query-ref
               id (str (random-uuid))]
           (when-not (= value current-value)
             (set-value! current-value))
           (add-watch query-ref id (fn [_ _ prev-state next-state]
                                     (when-not (= prev-state next-state)
                                       (set-value! next-state))))
           #(remove-watch query-ref id))
         (do
           (set-value! nil)
           nil)))
     [query-ref])
    value))
