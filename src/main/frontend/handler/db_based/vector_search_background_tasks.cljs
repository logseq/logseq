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

(run-background-task-when-not-publishing
 ::init-load-model-when-switch-graph
 (m/reduce
  (constantly nil)
  (m/ap
    (m/?> vector-search-flows/infer-worker-ready-flow)
    (when-let [repo (m/?< flows/current-repo-flow)]
      (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-init-embedding-model repo))
      (m/?
       (m/reduce
        (fn []
          (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo))
        ;; index new updates every 30s
        (c.m/clock (* 30 1000))))))))
