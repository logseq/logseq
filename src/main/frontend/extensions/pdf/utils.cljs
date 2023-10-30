(ns frontend.extensions.pdf.utils
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.util :as util]
            ["/frontend/extensions/pdf/utils" :as js-utils]
            [datascript.core :as d]
            [logseq.publishing.db :as publish-db]
            [clojure.string :as string]))

(defonce MAX-SCALE 5.0)
(defonce MIN-SCALE 0.25)
(defonce DELTA_SCALE 1.05)

(defn hls-file?
  [filename]
  (and filename (string? filename) (string/starts-with? filename "hls__")))

(def get-area-block-asset-url publish-db/get-area-block-asset-url)

(defn get-bounding-rect
  [rects]
  (bean/->clj (js-utils/getBoundingRect (bean/->js rects))))

(defn viewport-to-scaled
  [bounding ^js viewport]
  (bean/->clj (js-utils/viewportToScaled (bean/->js bounding) viewport)))

(defn scaled-to-viewport
  [bounding ^js viewport]
  (bean/->clj (js-utils/scaledToViewport (bean/->js bounding) viewport)))

(defn optimize-client-reacts
  [rects]
  (when (seq rects)
    (bean/->clj (js-utils/optimizeClientRects (bean/->js rects)))))

(defn vw-to-scaled-pos
  [^js viewer {:keys [page bounding rects]}]
  (when-let [^js viewport (.. viewer (getPageView (dec page)) -viewport)]
    {:bounding (viewport-to-scaled bounding viewport)
     :rects    (for [rect rects] (viewport-to-scaled rect viewport))
     :page     page}))

(defn scaled-to-vw-pos
  [^js viewer {:keys [page bounding rects]}]
  (when-let [^js viewport (.. viewer (getPageView (dec page)) -viewport)]
    {:bounding (scaled-to-viewport bounding viewport)
     :rects    (for [rect rects] (scaled-to-viewport rect viewport))
     :page     page}))

(defn get-page-bounding
  [^js viewer page-number]
  (when-let [^js el (and page-number (.. viewer (getPageView (dec page-number)) -div))]
    (bean/->clj (.toJSON (.getBoundingClientRect el)))))

(defn resolve-hls-layer!
  [^js viewer page]
  (when-let [^js text-layer (.. viewer (getPageView (dec page)) -textLayer)]
    (let [cnt (.-div text-layer)
          cls "extensions__pdf-hls-layer"
          doc js/document
          layer (.querySelector cnt (str "." cls))]
      (if-not layer
        (let [layer (.createElement doc "div")]
          (set! (. layer -className) cls)
          (.appendChild cnt layer)
          layer)
        layer))))

(defn scroll-to-highlight
  [^js viewer hl]
  (when-let [js-hl (bean/->js hl)]
    (js-utils/scrollToHighlight viewer js-hl)))

(defn zoom-in-viewer
  [^js viewer]
  (let [cur-scale (.-currentScale viewer)]
    (when (< cur-scale MAX-SCALE)
      (let [new-scale (.toFixed (* cur-scale DELTA_SCALE) 2)
            new-scale (/ (js/Math.ceil (* new-scale 10)) 10)
            new-scale (min MAX-SCALE new-scale)]

        (set! (.-currentScale viewer) new-scale)))))

(defn zoom-out-viewer
  [^js viewer]
  (let [cur-scale (.-currentScale viewer)]
    (when (> cur-scale MIN-SCALE)
      (let [new-scale (.toFixed (/ cur-scale DELTA_SCALE) 2)
            new-scale (/ (js/Math.floor (* new-scale 10)) 10)
            new-scale (max MIN-SCALE new-scale)]

        (set! (.-currentScale viewer) new-scale)))))

(defn get-meta-data$
  [^js viewer]
  (when-let [^js doc (and viewer (.-pdfDocument viewer))]
    (p/create
      (fn [resolve]
        (p/catch
          (p/then (.getMetadata doc)
                  (fn [^js r]
                    (js/console.debug "[metadata] " r)
                    (when-let [^js info (and r (.-info r))]
                      (resolve (bean/->clj info)))))
          (fn [e]
            (resolve nil)
            (js/console.error e)))))))

(defn clear-all-selection
  []
  (.removeAllRanges (js/window.getSelection)))

(def adjust-viewer-size!
  (util/debounce
    200 (fn [^js viewer] (set! (. viewer -currentScaleValue) "auto"))))

(defn fix-nested-js
  [its]
  (when (sequential? its)
    (mapv #(if (map? %) % (bean/->clj %)) its)))

(defn gen-uuid []
  (d/squuid))

(defn load-base-assets$
  []
  (p/let [_ (util/js-load$ (str util/JS_ROOT "/pdfjs/pdf.js"))
          _ (util/js-load$ (str util/JS_ROOT "/pdfjs/pdf_viewer.js"))]))

(defn get-page-from-el
  [^js/HTMLElement el]
  (when-let [^js page-el (and el (.closest el ".page"))]
    {:page-number (.. page-el -dataset -pageNumber)
     :page-el     page-el}))

(defn get-page-from-range
  [^js/Range r]
  (when-let [parent-el (and r (.. r -startContainer -parentElement))]
    (get-page-from-el parent-el)))

(defn get-range-rects<-page-cnt
  [^js/Range r ^js page-cnt]
  (let [rge-rects (bean/->clj (.getClientRects r))
        ^js cnt-offset (.getBoundingClientRect page-cnt)]

    (when (seq rge-rects)
      (let [rects (for [rect rge-rects]
                    {:top    (- (+ (.-top rect) (.-scrollTop page-cnt)) (.-top cnt-offset))
                     :left   (- (+ (.-left rect) (.-scrollLeft page-cnt)) (.-left cnt-offset))
                     :width  (.-width rect)
                     :height (.-height rect)})]
        (optimize-client-reacts rects)))))

(defn fix-selection-text-breakline
  [text]

  (when-not (string/blank? text)
    (let [sp "|#|"]
      (-> text
          (string/replace #"[\r\n]+" sp)
          (string/replace (str "-" sp) "")
          (string/replace #"\|#\|([a-zA-Z_])" " $1")
          (string/replace sp "")))))

(defn fix-local-asset-pagename
  [filename]
  (when-not (string/blank? filename)
    (let [local-asset? (re-find #"[0-9]{13}_\d$" filename)
          hls?         (hls-file? filename)
          len          (count filename)]
      (if (or local-asset? hls?)
        (-> filename
            (subs 0 (if local-asset? (- len 15) len))
            (string/replace #"^hls__" "")
            (string/replace #"__[-\d]+$" "")
            (string/replace "_" " ")
            (string/trimr))
        filename))))

;; TODO: which viewer instance?
(defn next-page
  []
  (try
    (js-invoke js/window.lsActivePdfViewer "nextPage")
    (catch :default _e nil)))

(defn prev-page
  []
  (try
    (js-invoke js/window.lsActivePdfViewer "previousPage")
    (catch :default _e nil)))

(defn open-finder
  []
  (try
    (when-let [^js el (js/document.querySelector ".extensions__pdf-toolbar a[title=Search]")]
      (.click el))
    (catch js/Error _e nil)))

(comment
 (fix-selection-text-breakline "this is a\ntest paragraph")
 (fix-selection-text-breakline "he is 1\n8 years old")
 (fix-selection-text-breakline "这是一个\n\n段落")
 (fix-selection-text-breakline "これ\n\nは、段落")
 (fix-selection-text-breakline "this is a te-\nst paragraph"))
