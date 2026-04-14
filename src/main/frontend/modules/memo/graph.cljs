;; src/main/frontend/modules/memo/graph.cljs
(ns frontend.modules.memo.graph)

(defn build-setting-graph
  "Builds a graph of all settings and their relationships.
  Returns a map with :nodes and :links for D3.js rendering."
  []
  {:nodes []
   :links []})