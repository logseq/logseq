(ns frontend.extensions.pdf.utils
  (:require [promesa.core :as p]
            [frontend.loader :refer [load]]))

(defn js-load$
  [url]
  (p/create
   (fn [resolve]
     (load url resolve))))

(defn load-base-assets$
  []
  (p/let [_ (js-load$ "./static/js/pdfjs/pdf.js")
          _ (js-load$ "./static/js/pdfjs/pdf_viewer.js")]))

(defn get-page-from-el
  [^js/HTMLElement el]
  (when-let [^js page-el (and el (.closest el ".page"))]
    {:page-number  (.. page-el -dataset -pageNumber)
     :page-el page-el}))

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