(ns logseq.common.file-graph-import
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]))

(def terminal-contract-version 1)

(def ^:private staging-graph-prefix ".logseq-file-graph-import-")

(defn staging-repo
  [run-id]
  {:pre [(seq run-id)]}
  (str common-config/db-version-prefix staging-graph-prefix run-id))

(defn staging-repo?
  [repo]
  (some-> repo
          common-config/strip-leading-db-version-prefix
          (string/starts-with? staging-graph-prefix)))

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
