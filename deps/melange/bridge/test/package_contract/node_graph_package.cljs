(ns node-graph-package
  (:require ["@logseq/melange-js-api/node" :as node-api]))

(defn -main
  []
  (let [graph-fs (.-GraphFs node-api)]
    (when-not (and (fn? (.-readdir graph-fs))
                   (fn? (.-readDirectories graph-fs))
                   (fn? (.-getFiles graph-fs))
                   (fn? (.-getDefaultGraphsDir graph-fs))
                   (fn? (.-expandHome graph-fs))
                   (fn? (.-getDbGraphsDir graph-fs))
                   (fn? (.-getDbBasedGraphs graph-fs))
                   (fn? (.-getDbBasedGraphsInDir graph-fs))
                   (= "/tmp/graphs" ((.-expandHome graph-fs) "/tmp/graphs")))
      (throw (js/Error. "Node graph filesystem package surface is incomplete")))))
