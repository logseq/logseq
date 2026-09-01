(ns frontend.worker.handler.render-resource.engine
  "Renderer resource registry, batching, and thread API."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.render-resource.basic :as basic]
            [frontend.worker.handler.render-resource.common :as common]
            [frontend.worker.handler.render-resource.property :as property]
            [frontend.worker.handler.render-resource.query :as query]
            [frontend.worker.handler.render-resource.view :as view]
            [frontend.worker.state :as worker-state]))

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
  (let [[watch value slots] (resource-value db resource-key runtime)
        watch-all? (= common/watch-all watch)
        watch-keys (if watch-all? #{} watch)]
    (when-not (set? watch-keys)
      (common/fail! "Invalid renderer resource watch keys"
                    {:resource-key resource-key :watch watch}))
    {:watch-keys watch-keys
     :watch-all? watch-all?
     :value value
     :slots (or slots {})}))

(def ^:private snapshot-request-limits
  {:blocks 1000 :children 25 :resources 25})

(defn- require-snapshot-request!
  [request]
  (when-not (and (map? request)
                 (= #{:blocks :children :resources} (set (keys request)))
                 (some seq (vals request))
                 (every? (fn [[kind values]]
                           (and (vector? values)
                                (<= (count values)
                                    (get snapshot-request-limits kind))
                                (= values (vec (distinct values)))))
                         request))
    (common/fail! "Invalid renderer snapshot request"
                  {:request request :limits snapshot-request-limits}))
  request)

(defn- merge-slots
  [left right]
  (reduce-kv
   (fn [slots key value]
     (when-let [existing (get slots key)]
       (when-not (= existing value)
         (common/fail! "Conflicting renderer snapshot slots"
                       {:slot-key key})))
     (assoc slots key value))
   left
   right))

(defn- block-snapshot-slots
  [db block-uuids]
  (let [{:keys [blocks groups]}
        (block-handler/canonical-blocks db block-uuids)]
    {:slots (reduce (fn [slots block-uuid]
                      (if (contains? blocks block-uuid)
                        slots
                        (assoc slots [:block block-uuid] {:missing? true})))
                    (common/block-slots blocks)
                    block-uuids)
     :groups (into {}
                   (map (fn [block-uuid]
                          [[:block block-uuid]
                           (if-let [dependency-uuids (get groups block-uuid)]
                             (into #{} (map #(vector :block %)) dependency-uuids)
                             #{[:block block-uuid]})]))
                   block-uuids)}))

(defn- children-snapshot-groups
  [db parent-uuids]
  (into {}
        (map (fn [parent-uuid]
               (let [tree (block-handler/open-block-tree db parent-uuid)]
                 [[:children parent-uuid]
                  (common/block-bundle-slots tree)])))
        parent-uuids))

(defn render-snapshots
  [db {:keys [blocks children resources] :as request} runtime]
  (require-snapshot-request! request)
  (let [resource-entries (into {}
                               (map (fn [resource-key]
                                      [resource-key
                                       (resource-entry db resource-key runtime)]))
                               resources)
        {block-slots :slots block-groups :groups}
        (block-snapshot-slots db blocks)
        children-groups (children-snapshot-groups db children)
        base-slots (reduce merge-slots block-slots (vals children-groups))
        slots (reduce-kv
               (fn [slots resource-key entry]
                 (-> slots
                     (merge-slots (:slots entry))
                     (merge-slots
                      {[:resource resource-key]
                       {:watch {:keys (:watch-keys entry)
                                :all? (:watch-all? entry)}
                        :value (:value entry)}})))
               base-slots
               resource-entries)
        groups (into {}
                     (concat
                      block-groups
                      (map (fn [parent-uuid]
                             [[:children parent-uuid]
                              (set (keys (get children-groups
                                              [:children parent-uuid])))])
                           children)
                      (map (fn [[resource-key entry]]
                             [[:resource resource-key]
                              (conj (set (keys (:slots entry)))
                                    [:resource resource-key])])
                           resource-entries)))]
    {:basis-rev (common/basis-rev db)
     :slots slots
     :groups groups}))

(def-thread-api :thread-api/get-render-snapshots
  [repo request]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (render-snapshots @conn request {:repo repo})
    (common/fail! "Missing renderer snapshot database" {:repo repo})))
