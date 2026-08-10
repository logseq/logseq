(ns frontend.db.subs-loader
  "Batch renderer snapshot requests across every slot type."
  (:require [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private limits {:blocks 1000 :children 25 :resources 25})
(def ^:private slot-kind {:block :blocks :children :children :resource :resources})

(defonce ^:private *batch (atom {}))

(defn- reject!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- take-batch!
  []
  (let [entries (vals @*batch)]
    (reset! *batch {})
    entries))

(defn- request-groups
  [entries]
  (let [entries-by-kind (group-by (comp slot-kind first :slot-key) entries)]
    (mapcat (fn [[kind limit]]
              (map vec (partition-all limit (get entries-by-kind kind))))
            limits)))

(defn- worker-request
  [entries]
  (reduce (fn [request {:keys [slot-key]}]
            (update request (slot-kind (first slot-key)) conj (second slot-key)))
          {:blocks [] :children [] :resources []}
          entries))

(defn- entry-response
  [response {:keys [slot-key]}]
  (if-let [group (get-in response [:groups slot-key])]
    {:basis-rev (:basis-rev response)
     :slots (select-keys (:slots response) group)}
    (throw (ex-info "Missing renderer snapshot group"
                    {:slot-key slot-key}))))

(defn- flush!
  []
  (when @state/db-worker-ready?
    (let [batch (take-batch!)]
      (doseq [[graph-id graph-entries] (group-by :graph-id batch)
              entries (request-groups graph-entries)]
        (-> (state/<invoke-db-worker :thread-api/get-render-snapshots
                                     graph-id
                                     (worker-request entries))
            (p/then (fn [response]
                      (try
                        (let [values (mapv #(entry-response response %) entries)]
                          (doseq [[entry value] (map vector entries values)]
                            (p/resolve! (:result entry) value)))
                        (catch :default error
                          (reject! entries error)))))
            (p/catch #(reject! entries %)))))))

(defn- flush-when-db-worker-ready!
  [_key _ref _old-value ready?]
  (when ready?
    (flush!)))

(add-watch state/db-worker-ready?
           ::flush-pending-loads
           flush-when-db-worker-ready!)

(defn load!
  [graph-id slot-key schedule!]
  (let [entry-key [graph-id slot-key]]
    (if-let [result (get-in @*batch [entry-key :result])]
      result
      (let [result (p/deferred)
            schedule? (empty? @*batch)]
        (swap! *batch assoc entry-key
               {:graph-id graph-id :slot-key slot-key :result result})
        (when schedule?
          (schedule! flush!))
        result))))

(defn reject-pending!
  [error]
  (let [entries (vals @*batch)]
    (reset! *batch {})
    (reject! entries error)))
