(ns frontend.worker.handler.render-resource.engine
  "Renderer resource registry, batching, and thread API."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.handler.render-resource.basic :as basic]
            [frontend.worker.handler.render-resource.common :as common]
            [frontend.worker.handler.render-resource.property :as property]
            [frontend.worker.handler.render-resource.query :as query]
            [frontend.worker.handler.render-resource.view :as view]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]))

(def resource-renderers
  (merge basic/resource-renderers
         property/resource-renderers
         view/resource-renderers
         query/resource-renderers
         {:block-sync-conflicts
          (common/renderer nil
                           (fn [_db resource-key _runtime]
                             (common/fail!
                              "Renderer resource belongs to a non-DB provider"
                              {:provider :sync-state
                               :resource-key resource-key})))}))

(defn- resource-value
  [db resource-key runtime]
  (when-not (and (vector? resource-key) (seq resource-key))
    (common/fail! "Invalid renderer resource key"
                  {:resource-key resource-key}))
  (case (common/invalid-resource-key-value resource-key)
    :function
    (common/fail! "Renderer resource keys cannot contain functions"
                  {:resource-key resource-key})

    :entity
    (common/fail! "Renderer resource keys cannot contain graph entities"
                  {:resource-key resource-key})

    (let [resource-kind (first resource-key)]
      (if-let [{:keys [shape render]} (get resource-renderers resource-kind)]
        (do
          (when shape
            (common/require-shape! resource-key resource-kind shape))
          (render db resource-key runtime))
        (common/fail! "Unknown renderer resource key"
                      {:resource-key resource-key})))))

(defn- resource-entry
  [db resource-key runtime]
  (let [[watch-keys value] (resource-value db resource-key runtime)]
    {:watch-keys watch-keys :value value}))

(defn render-resource
  ([db resource-key]
   (render-resource db resource-key {}))
  ([db resource-key runtime]
   (let [{:keys [watch-keys value]} (resource-entry db resource-key runtime)]
     (common/envelope db resource-key watch-keys value))))

(def ^:private render-resource-batch-limit 25)

(defn- require-resource-keys!
  [resource-keys]
  (when-not (and (vector? resource-keys)
                 (seq resource-keys)
                 (<= (count resource-keys) render-resource-batch-limit)
                 (= (count resource-keys) (count (distinct resource-keys))))
    (common/fail! "Invalid renderer resource batch"
                  {:resource-keys resource-keys
                   :max-size render-resource-batch-limit}))
  resource-keys)

(defn render-resources
  ([db resource-keys]
   (render-resources db resource-keys {}))
  ([db resource-keys runtime]
   (require-resource-keys! resource-keys)
   {:basis-rev (common/basis-rev db)
    :resources
    (into {}
          (map (fn [resource-key]
                 (let [started-at (.now js/performance)
                       entry (resource-entry db resource-key runtime)
                       completed-at (.now js/performance)]
                   (when (and goog.DEBUG (> (- completed-at started-at) 10))
                     (log/info :db-worker/render-resource-perf
                               {:resource-key resource-key
                                :elapsed-ms (- completed-at started-at)}))
                   [resource-key
                    entry])))
          resource-keys)}))

(def-thread-api :thread-api/get-render-resources
  [repo resource-keys]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (render-resources @conn resource-keys {:repo repo})
    (common/fail! "Missing renderer resource database" {:repo repo})))
