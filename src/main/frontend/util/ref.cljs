(ns frontend.util.ref
  "Reference-related util fns"
  (:require [logseq.common.util.page-ref :as page-ref]))

(defn ->block-ref
  [id]
  (page-ref/->page-ref id))

(def ->page-ref page-ref/->page-ref)
