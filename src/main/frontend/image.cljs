(ns frontend.image
  (:require ["/frontend/exif" :as exif]
            [clojure.string :as string]
            [frontend.date :as date]
            [goog.object :as gobj]))

(defn reverse?
  [exif-orientation]
  (contains? #{5 6 7 8} exif-orientation))

(defn re-scale
  [exif-orientation width height max-width max-height]
  (let [[width height]
        (if (reverse? exif-orientation)
          [height width]
          [width height])]
    (let [ratio (/ width height)
          to-width (if (> width max-width) max-width width)
          to-height (if (> height max-height) max-height height)
          new-ratio (/ to-width to-height)]
      (let [[w h] (cond
                    (> new-ratio ratio)
                    [(* ratio to-height) to-height]

                    (< new-ratio ratio)
                    [to-width (/ to-width ratio)]

                    :else
                    [to-width to-height])]
        [(int w) (int h)]))))

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

;; (defn build-image
;;   []
;;   (let [img (js/Image.)]
;;     ))

(defn upload
  [files file-handler & {:keys [max-width max-height files-limit]
                         :or {max-width 1920
                              max-height 1080
                              files-limit 1}}]
  (doseq [file (take files-limit (array-seq files))]
    (let [file-type (gobj/get file "type")
          ymd (->> (vals (date/year-month-day-padded))
                   (string/join "_"))
          file-name (str ymd "_" (gobj/get file "name"))]
      (when (= 0 (.indexOf file-type "image/"))
        (file-handler file file-name file-type)
        ;; (let [img (js/Image.)]
        ;;   (set! (.-onload img)
        ;;         (fn []
        ;;           (get-orientation img
        ;;                            (fn [^js off-canvas]
        ;;                              (let [file-form-data ^js (js/FormData.)
        ;;                                    data-url (.toDataURL off-canvas)
        ;;                                    blob (blob/blob data-url)]
        ;;                                (.append file-form-data "file" blob)
        ;;                                (file-cb file file-form-data file-name file-type)))
        ;;                            max-width
        ;;                            max-height)))
        ;;   (set! (.-src img)
        ;;         (create-object-url file)))
        ))))
