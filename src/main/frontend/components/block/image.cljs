(ns frontend.components.block.image
  "Helpers for rendering image blocks and asset image references."
  (:require [clojure.string :as string]
            [frontend.util :as util]))

(defn remote-image-url?
  "Remote http(s) posters/images get a link fallback. Blob, file, and
  data URLs stay as <img> so local asset drops are not replaced."
  [src]
  (boolean
   (and (string? src)
        (or (string/starts-with? src "https://")
            (string/starts-with? src "http://")))))

(defn asset-fallback-link-event?
  [^js e]
  (let [target (.-target e)]
    (boolean
     (when (and target (fn? (.-closest target)))
       (.closest target "a.asset-image-fallback")))))

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
      :title (or title src)
      :on-pointer-down util/stop-propagation
      :on-click util/stop-propagation}
     label]))

(defn image-or-fallback
  [{:keys [src title gallery-view? metadata load-failed? on-error]}]
  (if (and load-failed? (remote-image-url? src))
    (image-fallback-link src title)
    [:img.rounded-sm.relative.fade-in.fade-in-faster
     (merge
      (cond-> {:loading "lazy"
               :referrerPolicy "no-referrer"
               :src src}
        (and on-error (remote-image-url? src))
        (assoc :on-error on-error)
        (not gallery-view?)
        (assoc :title title))
      metadata)]))
