(ns frontend.db.subs-loader
  "Batch renderer snapshot requests across every slot type."
  (:require [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private limits {:blocks 1000 :children 25 :resources 25})
(def ^:private slot-kind {:block :blocks :children :children :resource :resources})

(defonce ^:private *batch (atom {}))

;; Number of worker requests in flight. The worker answers requests in order
;; on one thread, so a wave sent while another is out waits behind it there.
;; Held back in the renderer instead, a wave is pruned of entries whose slot
;; lost its last subscriber before it goes out.
(defonce ^:private *in-flight (atom 0))

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

(declare flush!)

(defn- wave-done!
  "Called once per wave, before its entries are settled, so the next wave
   reaches the worker while the renderer applies this one."
  []
  (swap! *in-flight dec)
  (when (and (zero? @*in-flight) (seq @*batch))
    (flush!)))

(defn- send-wave!
  [graph-id entries]
  (swap! *in-flight inc)
  (-> (p/do! (state/<invoke-db-worker :thread-api/get-render-snapshots
                                      graph-id
                                      (worker-request entries)))
      (p/then (fn [response]
                (wave-done!)
                (try
                  (let [values (mapv #(entry-response response %) entries)]
                    (doseq [[entry value] (map vector entries values)]
                      (p/resolve! (:result entry) value)))
                  (catch :default error
                    (reject! entries error)))))
      (p/catch (fn [error]
                 (wave-done!)
                 (reject! entries error)))))

(defn- flush!
  []
  (when (and @state/db-worker-ready? (zero? @*in-flight))
    (let [batch (take-batch!)
          {live true dropped false} (group-by (fn [{:keys [wanted? slot-key]}]
                                                (boolean (wanted? slot-key)))
                                              batch)]
      (when (seq dropped)
        (reject! dropped (ex-info "Snapshot load skipped: the slot has no subscriber"
                                  {:slot-keys (mapv :slot-key dropped)})))
      (doseq [[graph-id graph-entries] (group-by :graph-id live)
              entries (request-groups graph-entries)]
        (send-wave! graph-id entries)))))

(defn- flush-when-db-worker-ready!
  [_key _ref _old-value ready?]
  ;; A worker that went away takes its unanswered waves with it.
  (reset! *in-flight 0)
  (when ready?
    (flush!)))

(add-watch state/db-worker-ready?
           ::flush-pending-loads
           flush-when-db-worker-ready!)

(defn load!
  "Queues a snapshot load for slot-key. `wanted?` is asked, with the slot key,
   right before the request goes out; a false answer drops the entry and
   rejects its promise."
  [graph-id slot-key schedule! wanted?]
  (let [entry-key [graph-id slot-key]]
    (if-let [result (get-in @*batch [entry-key :result])]
      result
      (let [result (p/deferred)
            schedule? (empty? @*batch)]
        (swap! *batch assoc entry-key
               {:graph-id graph-id :slot-key slot-key :result result :wanted? wanted?})
        (when schedule?
          (schedule! flush!))
        result))))

(defn reject-pending!
  [error]
  (let [entries (vals @*batch)]
    (reset! *batch {})
    (reset! *in-flight 0)
    (reject! entries error)))
