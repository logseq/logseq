(ns logseq.common.file-graph-import
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]))

(def terminal-contract-version 1)

(def ^:private terminal-statuses
  #{:completed :completed-with-errors :failed})

(def ^:private staging-graph-prefix ".logseq-file-graph-import-")

(defn staging-repo
  [run-id]
  {:pre [(common-util/uuid-string? run-id)]}
  (str common-config/db-version-prefix staging-graph-prefix run-id))

(defn staging-repo?
  [repo]
  (let [graph-name (some-> repo common-config/strip-leading-db-version-prefix)]
    (boolean
     (when (and (string? graph-name)
                (string/starts-with? graph-name staging-graph-prefix))
       (common-util/uuid-string?
        (subs graph-name (count staging-graph-prefix)))))))

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

(defn- recoverable-issues?
  [issues]
  (every? #(true? (:recoverable? %)) issues))

(defn completed-result
  [run-id result]
  (when-not (= :passed (get-in result [:validation :status]))
    (throw (ex-info "completed import result requires passed validation"
                    {:code :import/invalid-completed-result
                     :run-id run-id})))
  (let [issues (vec (:issues result))]
    (when-not (recoverable-issues? issues)
      (throw (ex-info "completed import result requires recoverable issues"
                      {:code :import/invalid-completed-result
                       :run-id run-id})))
    (assoc result
           :contract-version terminal-contract-version
           :run-id run-id
           :status (if (seq issues) :completed-with-errors :completed)
           :phase :completed
           :summary {:issue-count (count issues)}
           :issues issues
           :publication (or (:publication result) {:status :pending}))))

(defn- valid-terminal-result?
  [run-id result]
  (let [status (:status result)
        issues (:issues result)]
    (and (= terminal-contract-version (:contract-version result))
         (= run-id (:run-id result))
         (contains? terminal-statuses status)
         (vector? issues)
         (= (count issues) (get-in result [:summary :issue-count]))
         (map? (:validation result))
         (map? (:publication result))
         (case status
           :completed
           (and (= :completed (:phase result))
                (= :passed (get-in result [:validation :status]))
                (empty? issues))

           :completed-with-errors
           (and (= :completed (:phase result))
                (= :passed (get-in result [:validation :status]))
                (seq issues)
                (recoverable-issues? issues))

           :failed
           (and (keyword? (:phase result))
                (seq issues))))))

(defn normalize-terminal-result
  [run-id result]
  (if (valid-terminal-result? run-id result)
    result
    (failed-result run-id :worker-import :import/invalid-terminal-result)))
