(ns logseq.graph-parser.log
  "Minimal, logging ns that shims lambdaisland.glogi fns for nbb. Could port
  glogi to nbb later if this shim gets too big")

(defn error [& msgs]
  (apply js/console.error (map clj->js msgs)))
