(ns frontend.handler.graph-failover
  "Switches away from an unavailable active graph without deleting graph data."
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util.text :as text-util]))

(defn- graph-name
  [repo]
  (text-util/get-graph-name-from-path repo))

(defn- fallback-graph
  [failed-repo]
  (some (fn [{:keys [url]}]
          (when (not= failed-repo url)
            url))
        (state/get-repos)))

(defn switch-away-from-current-repo!
  ([failed-repo]
   (switch-away-from-current-repo! failed-repo {}))
  ([failed-repo _opts]
   (when (= failed-repo (state/get-current-repo))
     (state/set-current-repo! nil)
     (if-let [graph (fallback-graph failed-repo)]
       (do
         (notification/show! (t :graph.switch/db-worker-unavailable-switching-warning
                                (graph-name failed-repo)
                                (graph-name graph))
                             :warning)
         (state/pub-event! [:graph/switch graph {:persist? false}])
         graph)
       (do
         (notification/show! (t :graph.switch/db-worker-unavailable-no-fallback-warning
                                (graph-name failed-repo))
                             :warning)
         nil)))))
