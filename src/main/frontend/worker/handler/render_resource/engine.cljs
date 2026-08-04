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
          (fn [_db resource-key _runtime]
            (common/fail! "Renderer resource belongs to a non-DB provider"
                           {:provider :sync-state
                           :resource-key resource-key}))}))

(def ^:private resource-shapes
  {:favorites 1
   :favorite-status 2
   :recent-pages 2
   :page-identity 2
   :page-preview-source 2
   :block-breadcrumb 3
   :journals 2
   :recycle-roots 1
   :property-choices 2
   :journal-bundle 2
   :journal-window 2
   :block-reactions 3
   :block-display-properties 3
   :block-positioned-properties 3
   :block-bidirectional-properties 2
   :block-ref-count 2
   :block-unlinked-ref-exists 2
   :block-comment-threads 2
   :block-comment-summary 2
   :block-task-time 2
   :route-block 3
   :views 3
   :view-data 3
   :query 2})

(defn- resource-value
  [db resource-key runtime]
  (when-not (and (vector? resource-key) (seq resource-key))
    (common/fail! "Invalid renderer resource key"
                  {:resource-key resource-key}))
  (when (common/function-bearing? resource-key)
    (common/fail! "Renderer resource keys cannot contain functions"
                  {:resource-key resource-key}))
  (when (common/entity-bearing? resource-key)
    (common/fail! "Renderer resource keys cannot contain graph entities"
                  {:resource-key resource-key}))
  (let [resource-kind (first resource-key)]
    (if-let [render (get resource-renderers resource-kind)]
      (do
        (when-let [shape (get resource-shapes resource-kind)]
          (common/require-shape! resource-key resource-kind shape))
        (render db resource-key runtime))
      (common/fail! "Unknown renderer resource key"
                    {:resource-key resource-key}))))

(defn render-resource
  ([db resource-key]
   (render-resource db resource-key {}))
  ([db resource-key runtime]
   (let [[watch-keys value] (resource-value db resource-key runtime)]
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
                       [watch-keys value] (resource-value db resource-key runtime)
                       completed-at (.now js/performance)]
                   (when (and goog.DEBUG (> (- completed-at started-at) 10))
                     (log/info :db-worker/render-resource-perf
                               {:resource-key resource-key
                                :elapsed-ms (- completed-at started-at)}))
                   [resource-key
                    {:watch-keys watch-keys
                     :value value}])))
          resource-keys)}))

(def-thread-api :thread-api/get-render-resources
  [repo resource-keys]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (render-resources @conn resource-keys {:repo repo})
    (common/fail! "Missing renderer resource database" {:repo repo})))
