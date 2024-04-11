(ns logseq.db.frontend.default
  "Provides vars and fns for dealing with default/built-in? data")

;; TODO: Use build-property-pair fn when circular ns dependencies are resolved
(defn mark-block-as-built-in
  "Marks built-in blocks as built-in? including pages, classes, properties and closed values"
  [block]
  (assoc block :block/properties {:property/pair-property {:db/ident :logseq.property/built-in?}
                                  :logseq.property/built-in? true}))
