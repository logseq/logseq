(ns frontend.worker.graph-dir
  "Compatibility wrapper around `logseq.common.graph-dir`."
  (:require [logseq.common.graph-dir :as common-graph-dir]))

(def repo->graph-dir-key common-graph-dir/repo->graph-dir-key)
(def repo->encoded-graph-dir-name common-graph-dir/repo->encoded-graph-dir-name)
(def decode-graph-dir-name common-graph-dir/decode-graph-dir-name)
