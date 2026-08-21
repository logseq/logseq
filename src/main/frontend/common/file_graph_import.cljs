(ns frontend.common.file-graph-import)

(def terminal-contract-version 1)

(defn failed-result
  [run-id phase code]
  {:contract-version terminal-contract-version
   :run-id run-id
   :status :failed
   :phase phase
   :summary {:issue-count 1}
   :issues [{:code code
             :severity :error
             :recoverable? false
             :phase phase
             :parameters {}}]
   :validation {:status :not-run}
   :publication {:status :blocked}})

(defn completed-result
  [run-id result]
  (assoc result
         :contract-version terminal-contract-version
         :run-id run-id
         :status :completed
         :phase :completed
         :summary {:issue-count 0}
         :issues []
         :publication (or (:publication result) {:status :pending})))
