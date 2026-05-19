(ns frontend.components.block.image
  "Helpers for rendering image blocks and asset image references.")

(defn effective-image-metadata
  [config asset-block metadata]
  (let [resize-metadata (if asset-block
                          (:logseq.property.asset/resize-metadata asset-block)
                          (get-in config [:block :logseq.property.asset/resize-metadata]))]
    (if (map? resize-metadata)
      (merge metadata resize-metadata)
      metadata)))
