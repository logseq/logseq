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

(defn image-fallback-link
  "Clickable URL fallback when a remote poster or image fails to load."
  [src title]
  (let [href (or src "")
        label (if (seq title) title src)]
    [:a.asset-image-fallback.external-link
     {:href href
      :target "_blank"
      :rel "noopener noreferrer"
      :title (or title src)}
     label]))

(defn image-or-fallback
  [{:keys [src title gallery-view? metadata load-failed? on-error]}]
  (if load-failed?
    (image-fallback-link src title)
    [:img.rounded-sm.relative.fade-in.fade-in-faster
     (merge
      (cond-> {:loading "lazy"
               :referrerPolicy "no-referrer"
               :src src
               :on-error on-error}
        (not gallery-view?)
        (assoc :title title))
      metadata)]))
