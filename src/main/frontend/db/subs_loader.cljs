(ns frontend.db.subs-loader
  "One batched worker loader for blocks, children, and renderer resources."
  (:require [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private batch-limits
  {:blocks 1000
   :children 25
   :resources 25})

(def ^:private worker-apis
  {:blocks :thread-api/get-canonical-blocks
   :children :thread-api/get-direct-children
   :resources :thread-api/get-render-resources})

(defonce ^:private *batch
  (atom {:scheduled #{}
         :entries {}}))

(defn- reject-entries!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- take-kind-entries!
  [kind]
  (let [loaded (->> (:entries @*batch)
                    (filter (fn [[[entry-kind _ _] _]]
                              (= kind entry-kind)))
                    (mapv second))]
    (swap! *batch
           (fn [{:keys [scheduled entries]}]
             {:scheduled (disj scheduled kind)
              :entries (apply dissoc entries
                              (map (fn [{:keys [graph-id key]}]
                                     [kind graph-id key])
                                   loaded))}))
    loaded))

(defn- response-value
  [kind {:keys [key]} {:keys [basis-rev children resources] :as response}]
  (case kind
    :blocks
    response

    :children
    (if-let [value (get children key)]
      (assoc value :basis-rev basis-rev)
      (throw (ex-info "Missing direct-children batch result"
                      {:parent-uuid key})))

    :resources
    (if-let [value (get resources key)]
      (assoc value :basis-rev basis-rev :key key)
      (throw (ex-info "Missing renderer resource batch result"
                      {:resource-key key})))))

(defn- flush-kind!
  [kind]
  (doseq [[graph-id entries]
          (group-by :graph-id (take-kind-entries! kind))
          batch (partition-all (get batch-limits kind) entries)]
    (let [keys (mapv :key batch)]
      (-> (state/<invoke-db-worker (get worker-apis kind) graph-id keys)
          (p/then (fn [response]
                    (let [values (mapv #(response-value kind % response) batch)]
                      (doseq [[{:keys [result]} value]
                              (map vector batch values)]
                        (p/resolve! result value)))))
          (p/catch (fn [error]
                     (reject-entries! batch error)))))))

(defn load!
  [kind graph-id key schedule!]
  (let [entry-key [kind graph-id key]]
    (if-let [result (get-in @*batch [:entries entry-key :result])]
      result
      (let [result (p/deferred)
            schedule? (not (contains? (:scheduled @*batch) kind))]
        (swap! *batch
               (fn [{:keys [scheduled entries]}]
                 {:scheduled (conj scheduled kind)
                  :entries (assoc entries entry-key
                                  {:kind kind
                                   :graph-id graph-id
                                   :key key
                                   :result result})}))
        (when schedule?
          (schedule! #(flush-kind! kind)))
        result))))

(defn reject-pending!
  [error]
  (let [entries (vals (:entries @*batch))]
    (reset! *batch {:scheduled #{} :entries {}})
    (reject-entries! entries error)))
