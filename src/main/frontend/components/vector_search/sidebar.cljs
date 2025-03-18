(ns frontend.components.vector-search.sidebar
  (:require [fipp.edn :as fipp]
            [frontend.common.missionary :as c.m]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.hooks :as hooks]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]))

(rum/defc vector-search-sidebar
  []
  (let [repo (state/get-current-repo)
        ^js worker @db-browser/*worker
        [vec-search-state set-vec-search-state] (hooks/use-state nil)
        [query-string set-query-string] (hooks/use-state nil)
        [result set-result] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (c.m/run-task
        (m/reduce
         (fn [_ v] (set-vec-search-state v))
         vector-search-flows/vector-search-state-flow)
        ::update-vec-search-state :succ (constantly nil)))
     [])
    (hooks/use-effect!
     (fn []
       (c.m/run-task
        (m/sp
          (-> (c.m/<? (.vec-search-search worker repo query-string 10))
              ldb/read-transit-str
              set-result))
        :update-search-result :succ (constantly nil)))
     [(hooks/use-debounced-value query-string 200)])
    [:div
     (let [state-map (get-in vec-search-state [:repo->index-info repo])]
       [:pre.select-text
        (with-out-str
          (fipp/pprint state-map {:width 10}))])
     (shui/button
      {:size :sm
       :class "mx-2"
       :on-click (fn [_] (.vec-search-embedding-stale-blocks worker repo))}
      "embedding-stale-blocks")
     (shui/button
      {:size :sm
       :class "mx-2"
       :on-click (fn [_] (.vec-search-re-embedding-graph-data worker repo))}
      "force-embedding-all-graph-blocks")
     (when (get-in vec-search-state [:repo->index-info repo :indexing?])
       (shui/button
        {:size :sm
         :class "mx-2"
         :on-click (fn [_] (.vec-search-cancel-indexing worker repo))}
        "cancel-current-indexing"))
     [:hr]
     [:b "Search:"]
     [:input.form-input.my-2.py-1
      {:on-change (fn [e] (set-query-string (util/evalue e)))}]
     [:b "Search Result:"]
     [:pre.select-text
      (with-out-str
        (fipp/pprint result {:width 10}))]]))
