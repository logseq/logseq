(ns logseq.common.log
  "Minimal, logging ns that shims lambdaisland.glogi fns for nbb. Could port
  glogi to nbb later if this shim gets too big")

(defn info
  "Logs one or more values at info level."
  [& msgs]
  (apply js/console.info (map clj->js msgs)))

(defn error
  "Logs one or more values at error level."
  [& msgs]
  (apply js/console.error (map clj->js msgs)))
