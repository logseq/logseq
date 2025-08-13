(ns frontend.handler.db-based.vector-search-background-tasks
  "Background tasks for vector-search"
  (:require [frontend.common.missionary :as c.m]
            [frontend.config :as config]
            [frontend.flows :as flows]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.state :as state]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(defn- run-background-task-when-not-publishing
  [key' task]
  (when-not config/publishing?
    (c.m/run-background-task key' task)))

(run-background-task-when-not-publishing
 ::init-load-model-when-switch-graph
 (m/reduce
  (constantly nil)
  (m/ap
    (m/?< vector-search-flows/infer-worker-ready-flow)
    (when-let [repo (m/?< flows/current-repo-flow)]
      (try
        ;; Don't block ui render (ui needs data from db-worker)
        (m/? (m/sleep 1000))
        (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-init-embedding-model repo))
        (m/?< (c.m/clock (* 30 1000)))
        (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo {}))
        (catch Cancelled _
          (m/amb)))))))
