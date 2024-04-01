(ns logseq.db.frontend.default
  "Provides vars and fns for dealing with default/built-in? data")

(defn mark-block-as-built-in
  "Marks built-in blocks as built-in? including pages, classes, properties and closed values"
  [block]
  (assoc block :logseq.property/built-in? true))
