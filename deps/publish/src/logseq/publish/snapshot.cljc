(ns logseq.publish.snapshot
  "Utilities for shaping page publishing snapshot payloads.")

(def required-keys
  #{:page :blocks :linked-refs :config})

(defn normalize-snapshot
  "Ensures the snapshot contains the minimum required keys.

  Expected shape:
  {:page       <page entity map>
   :blocks     <block tree or flat list>
   :linked-refs <linked references payload>
   :config     <publishing config map>
   :assets     <optional asset map>}
  "
  [{:keys [page blocks linked-refs config] :as snapshot}]
  (merge
   {:page page
    :blocks (or blocks [])
    :linked-refs (or linked-refs [])
    :config (or config {})
    :assets (:assets snapshot)}
   (select-keys snapshot required-keys)))

(defn snapshot-valid?
  "Checks if required keys are present in the snapshot map."
  [snapshot]
  (every? #(contains? snapshot %) required-keys))
