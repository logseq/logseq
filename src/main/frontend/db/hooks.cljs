(ns frontend.db.hooks
  "Hooks for DB-backed React integration."
  (:require [frontend.db.react :as react]
            [frontend.rfx :as rfx]
            [logseq.shui.hooks :as hooks]))

(defn use-query
  "Subscribe to a DB reactive query result returned by `frontend.db.react/q`."
  [query-ref]
  (let [component-ref (hooks/use-ref nil)
        query-key (react/query-key query-ref)]
    (when-not (hooks/deref component-ref)
      (hooks/set-ref! component-ref (random-uuid)))
    (hooks/use-effect!
     (fn []
       (when query-key
         (react/sync-query-result! query-ref)
         (react/add-query-component! query-key (hooks/deref component-ref)))
       #(react/remove-query-component! (hooks/deref component-ref)))
     [query-key])
    (rfx/use-sub [:db/query-results query-key])))
