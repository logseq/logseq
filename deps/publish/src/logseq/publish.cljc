(ns logseq.publish
  "Public entrypoint for page publishing shared logic."
  (:require [logseq.publish.snapshot :as snapshot]
            [logseq.publish.ssr :as ssr]
            [logseq.publish.storage :as storage]))

(defn normalize-snapshot
  "Public wrapper around snapshot normalization."
  [snapshot-map]
  (snapshot/normalize-snapshot snapshot-map))

(defn snapshot-valid?
  "Checks required keys in the snapshot."
  [snapshot-map]
  (snapshot/snapshot-valid? snapshot-map))

(defn render-page-html
  "Render HTML for a published page."
  [snapshot-map opts]
  (ssr/render-page-html snapshot-map opts))

(def PublishStore storage/PublishStore)

;; Placeholder namespace for page publishing shared logic.
