(ns frontend.extensions.pdf.utils
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.util :as front-utils]
            ["/frontend/extensions/pdf/utils" :as js-utils]
            [frontend.loader :refer [load]]))

(defn get-bounding-rect
  [rects]
  (bean/->clj (js-utils/getBoundingRect (bean/->js rects))))

(defn viewport-to-scaled
  [bounding ^js viewport]
  (bean/->clj (js-utils/viewportToScaled (bean/->js bounding) viewport)))

(defn scaled-to-viewport
  [bounding ^js viewport]
  (bean/->clj (js-utils/scaledToViewport (bean/->js bounding) viewport)))

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
    (let [cnt (.-textLayerDiv text-layer)
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

(defn clear-all-selection
  []
  (.removeAllRanges (js/window.getSelection)))

(def adjust-viewer-size!
  (front-utils/debounce
    200 (fn [^js viewer] (set! (. viewer -currentScaleValue) "auto"))))

(defn gen-id []
  (str (.toString (js/Date.now) 36)
       (.. (js/Math.random) (toString 36) (substr 2 4))))

(defn js-load$
  [url]
  (p/create
    (fn [resolve]
      (load url resolve))))

(def PDFJS_ROOT
  (if (= js/location.protocol "file:")
    "./js"
    "./static/js"))

(defn load-base-assets$
  []
  (p/let [_ (js-load$ (str PDFJS_ROOT "/pdfjs/pdf.js"))
          _ (js-load$ (str PDFJS_ROOT "/pdfjs/pdf_viewer.js"))]))

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
  (let [rge-rects (js->clj (.getClientRects r))
        ^js cnt-offset (.getBoundingClientRect page-cnt)]

    (if (seq rge-rects)
      (for [rect rge-rects]
        {:top    (- (+ (.-top rect) (.-scrollTop page-cnt)) (.-top cnt-offset))
         :left   (- (+ (.-left rect) (.-scrollLeft page-cnt)) (.-left cnt-offset))
         :width  (.-width rect)
         :height (.-height rect)}))))