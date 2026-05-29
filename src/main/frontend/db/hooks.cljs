(ns frontend.db.hooks
  "Hooks for DB-backed React integration."
  (:require [frontend.db.react :as react]
            [logseq.shui.hooks :as hooks]))

(defn query-scope
  "Run `render-fn` with DB reactive query tracking bound to this component.

  This replaces the legacy DB query mixin."
  [render-fn]
  (let [[_render-token set-render-token!] (hooks/use-state 0)
        render-token-ref (hooks/use-ref 0)
        component-ref (hooks/use-ref nil)
        queries-ref (hooks/use-ref nil)]
    (when-not (hooks/deref component-ref)
      (hooks/set-ref! component-ref
                      (fn []
                        (let [next-token (inc (hooks/deref render-token-ref))]
                          (hooks/set-ref! render-token-ref next-token)
                          (set-render-token! next-token)))))
    (when-not (hooks/deref queries-ref)
      (hooks/set-ref! queries-ref (atom #{})))
    (hooks/use-effect!
     (fn []
       #(react/remove-query-component! (hooks/deref component-ref)))
     [])
    (binding [react/*query-component* (hooks/deref component-ref)
              react/*reactive-queries* (hooks/deref queries-ref)]
      (render-fn))))
