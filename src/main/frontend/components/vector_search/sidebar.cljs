(ns frontend.components.vector-search.sidebar
  (:require [clojure.string :as string]
            [fipp.edn :as fipp]
            [frontend.common.missionary :as c.m]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]))

(rum/defc ^:large-vars/cleanup-todo vector-search-sidebar
  []
  (let [repo (state/get-current-repo)
        [model-info set-model-info] (hooks/use-state nil)
        [vec-search-state set-vec-search-state] (hooks/use-state nil)
        [load-model-progress set-load-model-progress] (hooks/use-state nil)
        [query-string set-query-string] (hooks/use-state nil)
        [result set-result] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (c.m/run-task
         ::update-vec-search-state
         (m/reduce
          (fn [_ v]
            (set-vec-search-state v))
          (m/ap
            (m/?> vector-search-flows/infer-worker-ready-flow)
            (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-update-index-info repo))
            (m/?> vector-search-flows/vector-search-state-flow)))
         :succ (constantly nil)))
     [])
    (hooks/use-effect!
     (fn []
       (c.m/run-task
         ::update-load-model-progress
         (m/reduce
          (fn [_ v] (set-load-model-progress v))
          vector-search-flows/load-model-progress-flow)
         :succ (constantly nil)))
     [])
    (hooks/use-effect!
     (fn []
       (c.m/run-task
         ::fetch-model-info
         (m/reduce
          (constantly nil)
          (m/ap
            (m/?> vector-search-flows/infer-worker-ready-flow)
            (let [model-info (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-embedding-model-info repo))]
              (set-model-info model-info))))
         :succ (constantly nil)))
     [])
    (hooks/use-effect!
     (fn []
       (when-not (string/blank? query-string)
         (c.m/run-task
           :update-search-result
           (m/sp
             (-> (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-search repo query-string 10))
                 set-result))
           :succ (constantly nil))))
     [(hooks/use-debounced-value query-string 200)])
    [:div
     [:b "State"]
     (let [state-map (assoc (get-in vec-search-state [:repo->index-info repo])
                            :load-model-progress load-model-progress)]
       [:pre.select-text
        (with-out-str
          (fipp/pprint state-map {:width 10}))])
     [:hr]
     [:b "Actions"]
     [:div
      (shui/button
       {:size :sm
        :class "mx-2"
        :on-click (fn [_]
                    (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo {}))}
       "embedding-blocks")
      (shui/button
       {:size :sm
        :class "mx-2"
        :on-click (fn [_]
                    (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo {:reset-embedding? true}))}
       "full-embedding-blocks")
      (when (get-in vec-search-state [:repo->index-info repo :indexing?])
        (shui/button
         {:size :sm
          :class "mx-2"
          :on-click (fn [_]
                      (state/<invoke-db-worker :thread-api/vec-search-cancel-indexing repo))}
         "cancel-current-indexing"))]
     [:hr]
     [:b "Settings"]
     (shui/select
      {:on-value-change (fn [model-name]
                          (c.m/run-task
                            ::load-model
                            (m/sp
                              (c.m/<?
                               (state/<invoke-db-worker :thread-api/vec-search-load-model repo model-name)))
                            :succ (constantly nil)))}
      (shui/select-trigger
       (shui/select-value
        {:placeholder "Select a model(need force-embedding-all-graph-blocks again)"}))
      (shui/select-content
       (shui/select-group
        (let [graph-text-embedding-model-name (:graph-text-embedding-model-name model-info)]
          (for [model-name (:available-model-names model-info)]
            (shui/select-item {:value model-name :disabled? (= graph-text-embedding-model-name model-name)} model-name))))))
     [:hr]
     [:b "Search"]
     [:input.form-input.my-2.py-1
      {:on-change (fn [e] (set-query-string (util/evalue e)))}]
     [:b "Search Result:"]
     [:pre.select-text
      (with-out-str
        (fipp/pprint result {:width 10}))]]))
