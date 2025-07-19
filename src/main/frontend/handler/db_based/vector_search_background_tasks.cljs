(ns frontend.handler.db-based.vector-search-background-tasks
  "Background tasks for vector-search"
  (:require [frontend.common.missionary :as c.m]
            [frontend.config :as config]
            [frontend.flows :as flows]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.state :as state]
            [missionary.core :as m]))

(defn- run-background-task-when-not-publishing
  [key' task]
  (when-not config/publishing?
    (c.m/run-background-task key' task)))

(defonce *indexing-interval (atom nil))
(run-background-task-when-not-publishing
 ::init-load-model-when-switch-graph
 (m/reduce
  (constantly nil)
  (m/ap
    (m/?> vector-search-flows/infer-worker-ready-flow)
    (when-let [repo (m/?< flows/current-repo-flow)]
      (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-init-embedding-model repo))
      (when-let [i @*indexing-interval]
        (js/clearInterval i))
      (let [interval (js/setInterval
                      (fn []
                        (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo))
                      (* 5 1000))]
        (reset! *indexing-interval interval))))))
