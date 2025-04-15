(ns frontend.handler.graph
  "Provides util handler fns for graph view"
  (:require [frontend.state :as state]
            [frontend.storage :as storage]))

(defn n-hops
  "Get all nodes that are n hops from nodes (a collection of node ids)"
  [{:keys [links] :as graph} nodes level]
  (let [search-nodes (fn [forward?]
                       (let [links (group-by (if forward? :source :target) links)]
                         (loop [nodes nodes
                                level level]
                           (if (zero? level)
                             nodes
                             (recur (distinct (apply concat nodes
                                                     (map
                                                      (fn [id]
                                                        (->> (get links id) (map (if forward? :target :source))))
                                                      nodes)))
                                    (dec level))))))
        nodes (concat (search-nodes true) (search-nodes false))
        nodes (set nodes)]
    (update graph :nodes
            (fn [full-nodes]
              (filter (fn [node] (contains? nodes (:id node)))
                      full-nodes)))))

(defn settle-metadata-to-local!
  [m]
  (when-let [repo (state/get-current-repo)]
    (try
      (let [k :ls-graphs-metadata
            ret (or (storage/get k) {})
            ret (update ret repo merge m {:_v (js/Date.now)})]
        (storage/set k ret))
      (catch js/Error e
        (js/console.warn e)))))

(defn get-metadata-local
  []
  (let [k :ls-graphs-metadata]
    (storage/get k)))
