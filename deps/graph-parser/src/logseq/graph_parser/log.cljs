(ns logseq.graph-parser.log
  "Minimal logging ns that implements basic lambdaisland.glogi fns. May use
  glogi later if this ns is used more")

(defn error [& msgs]
  (apply js/console.error (map clj->js msgs)))
