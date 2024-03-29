(ns logseq.db.frontend.default
  "Provides vars and fns for dealing with default/built-in? data"
  (:require [datascript.core :as d]))

(defn mark-block-as-built-in
  "Marks built-in blocks as built-in? including pages, classes, properties and closed values"
  [db block]
  (let [built-in-property-id (:block/uuid (d/entity db :logseq.property/built-in?))]
    (update block :block/properties assoc built-in-property-id true)))
