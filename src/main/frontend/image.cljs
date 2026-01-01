(ns frontend.image
  "Image related utility fns"
  (:require ["/frontend/exif" :as exif]
            [goog.object :as gobj]))

(defn reverse?
  [exif-orientation]
  (contains? #{5 6 7 8} exif-orientation))

(defn re-scale
  [exif-orientation width height max-width max-height]
  (let [[width height]
        (if (reverse? exif-orientation)
          [height width]
          [width height])
        ratio (/ width height)
        to-width (if (> width max-width) max-width width)
        to-height (if (> height max-height) max-height height)
        new-ratio (/ to-width to-height)
        [w h] (cond
                (> new-ratio ratio)
                [(* ratio to-height) to-height]

                (< new-ratio ratio)
                [to-width (/ to-width ratio)]

                :else
                [to-width to-height])]
    [(int w) (int h)]))

(defn fix-orientation
  "Given image and exif orientation, ensure the photo is displayed
  rightside up"
  [img exif-orientation cb max-width max-height]
  (let [off-canvas (js/document.createElement "canvas")
        ctx ^js (.getContext off-canvas "2d")
        width (gobj/get img "width")
        height (gobj/get img "height")
        [to-width to-height] (re-scale exif-orientation width height max-width max-height)]
    (gobj/set ctx "imageSmoothingEnabled" false)
    (set! (.-width off-canvas) to-width)
    (set! (.-height off-canvas) to-height)
    ;; rotate
    (let [[width height] (if (reverse? exif-orientation)
                           [to-height to-width]
                           [to-width to-height])]
      (case exif-orientation
        2 (.transform ctx -1  0  0  1 width  0)
        3 (.transform ctx -1  0  0 -1 width  height)
        4 (.transform ctx  1  0  0 -1 0      height)
        5 (.transform ctx  0  1  1  0 0      0)
        6 (.transform ctx  0  1 -1  0 height 0)
        7 (.transform ctx  0 -1 -1  0 height width)
        8 (.transform ctx  0 -1  1  0 0      width)
        (.transform ctx  1  0  0  1 0      0))
      (.drawImage ctx img 0 0 width height))
    (cb off-canvas)))

(defn get-orientation
  [img cb max-width max-height]
  (exif/getEXIFOrientation
   img
   (fn [orientation]
     (fix-orientation img orientation cb max-width max-height))))

(defn create-object-url
  [file]
  (.createObjectURL (or (.-URL js/window)
                        (.-webkitURL js/window))
                    file))
