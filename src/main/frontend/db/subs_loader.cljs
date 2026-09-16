(ns frontend.db.subs-loader
  "Batch renderer snapshot requests across every slot type."
  (:require [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private view-resource-kinds #{:view-data :views})
(def ^:private flush-kind-order [:view-resources :resources :blocks :children])
(def ^:private limits {:view-resources 25 :resources 25 :blocks 1000 :children 25})
(def ^:private slot-kind {:block :blocks :children :children :resource :resources})
(def ^:private cancelled-error
  (ex-info "Renderer snapshot load cancelled" {::cancelled true}))

(defn- entry-flush-kind
  "view-data/views must leave in their own request. A mixed resource
  batch waits on block-ref-count before the first table window can paint."
  [{:keys [slot-key]}]
  (let [slot (first slot-key)]
    (if (= :resource slot)
      (let [resource-kind (first (second slot-key))]
        (if (contains? view-resource-kinds resource-kind)
          :view-resources
          :resources))
      (get {:block :blocks :children :children} slot))))

(defonce ^:private *batch (atom {}))
(defonce ^:private *flushing? (atom false))
(defonce ^:private *still-wanted-fn (atom (constantly true)))

(defn set-still-wanted-fn!
  [f]
  (reset! *still-wanted-fn f))

(defn- reject!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- take-batch!
  []
  (let [entries (vals @*batch)]
    (reset! *batch {})
    entries))

(defn- entry-key
  [{:keys [graph-id slot-key]}]
  [graph-id slot-key])

(defn- put-back!
  [entries]
  (when (seq entries)
    (swap! *batch
           (fn [batch]
             (reduce (fn [batch entry]
                       (assoc batch (entry-key entry) entry))
                     batch
                     entries)))))

(defn- request-groups
  "Flush view-data before other resources, then blocks, then children.
  One mixed batch used to wait on open-block-tree or block-ref-count
  before Tags/All Pages could paint their first window."
  [entries]
  (let [entries-by-kind (group-by entry-flush-kind entries)]
    (mapcat (fn [kind]
              (map vec (partition-all (get limits kind)
                                      (get entries-by-kind kind))))
            flush-kind-order)))

(defn- worker-request
  [entries]
  (reduce (fn [request {:keys [slot-key]}]
            (update request (slot-kind (first slot-key)) conj (second slot-key)))
          {:blocks [] :children [] :resources []}
          entries))

(defn- still-wanted?
  [{:keys [slot-key]}]
  (boolean (@*still-wanted-fn slot-key)))

(defn- take-next-request-group!
  []
  (let [entries (take-batch!)
        {wanted true cancelled false} (group-by still-wanted? entries)]
    (reject! cancelled cancelled-error)
    (when-let [[graph-id graph-entries] (first (group-by :graph-id wanted))]
      (let [groups (request-groups graph-entries)
            group (first groups)
            remaining-graph-entries (mapcat identity (rest groups))
            other-graph-entries (remove #(= graph-id (:graph-id %)) wanted)]
        (put-back! (concat remaining-graph-entries other-graph-entries))
        group))))

(defn- entry-response
  [response {:keys [slot-key]}]
  (if-let [group (get-in response [:groups slot-key])]
    {:basis-rev (:basis-rev response)
     :slots (select-keys (:slots response) group)}
    (throw (ex-info "Missing renderer snapshot group"
                    {:slot-key slot-key}))))

(defn- flush!
  []
  (when (and @state/db-worker-ready? (not @*flushing?))
    (when-let [entries (take-next-request-group!)]
      (reset! *flushing? true)
      (let [graph-id (:graph-id (first entries))]
        (-> (try
              (state/<invoke-db-worker :thread-api/get-render-snapshots
                                       graph-id
                                       (worker-request entries))
              (catch :default error
                (p/rejected error)))
            (p/then (fn [response]
                      (try
                        (let [values (mapv #(entry-response response %) entries)]
                          (doseq [[entry value] (map vector entries values)]
                            (p/resolve! (:result entry) value)))
                        (catch :default error
                          (reject! entries error)))))
            (p/catch #(reject! entries %))
            (p/finally (fn []
                         (reset! *flushing? false)
                         (flush!))))))))

(defn- flush-when-db-worker-ready!
  [_key _ref _old-value ready?]
  (when ready?
    (flush!)))

(add-watch state/db-worker-ready?
           ::flush-pending-loads
           flush-when-db-worker-ready!)

(defn load!
  [graph-id slot-key schedule!]
  (let [batch-key [graph-id slot-key]]
    (if-let [result (get-in @*batch [batch-key :result])]
      result
      (let [result (p/deferred)
            schedule? (empty? @*batch)]
        (swap! *batch assoc batch-key
               {:graph-id graph-id :slot-key slot-key :result result})
        (when schedule?
          (schedule! flush!))
        result))))

(defn reject-pending!
  [error]
  (let [entries (vals @*batch)]
    (reset! *batch {})
    (reset! *flushing? false)
    (reject! entries error)))
