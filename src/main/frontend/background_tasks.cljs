(ns frontend.background-tasks
  "Some background tasks"
  (:require [frontend.flows :as flows]
            [frontend.common.missionary :as c.m]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [missionary.core :as m]))

(c.m/run-background-task
 :logseq.db.frontend.entity-plus/reset-immutable-entities-cache!
 (m/reduce
  (fn [_ repo]
    (when (some? repo)
      ;; (prn :reset-immutable-entities-cache!)
      (entity-plus/reset-immutable-entities-cache!)))
  flows/current-repo-flow))
