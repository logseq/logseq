;; src/main/frontend/modules/memo/graph.cljs
(ns frontend.modules.memo.graph
  (:require [datascript.core :as d]
            [frontend.modules.memo.index :as index]))

(def type->color
  {:character "#6366f1"
   :world "#22c55e"
   :timeline "#f59e0b"
   :location "#ef4444"
   :custom "#8b5cf6"})

(defn build-setting-graph
  "Builds a graph of all settings and their relationships.
  Returns a map with :nodes and :links for D3.js rendering."
  []
  (let [conn @index/conn
        settings (when conn
                   (let [eids (set (map first (d/q '[:find ?e
                                                     :where
                                                     [?e :logseq.memo/id]]
                                                   conn)))]
                     (when (seq eids)
                       (d/pull-many conn '[:db/id :logseq.memo/id :logseq.memo/type :logseq.memo/relations] eids))))]
    (if (seq settings)
      (let [nodes (mapv (fn [setting]
                          {:id (:db/id setting)
                           :label (:logseq.memo/id setting)
                           :type (:logseq.memo/type setting)
                           :color (get type->color (:logseq.memo/type setting) "#6b7280")})
                        settings)
            links (mapcat (fn [setting]
                            (map (fn [rel]
                                   {:source (:db/id setting)
                                    :target (:target rel)})
                                 (:logseq.memo/relations setting)))
                          settings)]
        {:nodes nodes
         :links links})
      {:nodes []
       :links []})))