(ns logseq.common.log
  "Minimal, logging ns that shims lambdaisland.glogi fns for nbb. Could port
  glogi to nbb later if this shim gets too big")

(defn error [& msgs]
  (apply js/console.error (map clj->js msgs)))

(defn warn [& msgs]
  (apply js/console.warn (map clj->js msgs)))

(defn info [& msgs]
  (apply js/console.info (map clj->js msgs)))
