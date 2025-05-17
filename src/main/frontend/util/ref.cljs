(ns frontend.util.ref
  "Reference-related util fns"
  (:require [frontend.config :as config]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]))

(defn ->block-ref
  [id]
  (if (config/db-based-graph?)
    (page-ref/->page-ref id)
    (block-ref/->block-ref id)))

(def ->page-ref page-ref/->page-ref)
