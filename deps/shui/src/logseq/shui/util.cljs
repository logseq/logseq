(ns logseq.shui.util
  (:require 
    [clojure.string :as s]
    [rum.core :refer [use-state use-effect!] :as rum]
    [goog.dom :as gdom]))


;;      /--------------- app ------------\
;;    /-------- left --------\             \
;;  /l-side\                  \  /- r-side --\
;;
;; |--------|-------------------|-------------| \ head
;; |--------|-------------------|             | /
;; |        |                   |             |
;; |        |                   |             |
;; |        |                   |             |
;; |--------|-------------------|-------------|

(def $app           (partial gdom/getElement "app-container"))
(def $left          (partial gdom/getElement "left-container"))
(def $head          (partial gdom/getElement "head-container"))
(def $main          (partial gdom/getElement "main-container"))
(def $main-content  (partial gdom/getElement "main-content-container"))
(def $left-sidebar  (partial gdom/getElement "left-sidebar"))
(def $right-sidebar (partial gdom/getElement "right-sidebar"))

(defn el->clj-rect [el]
  (let [rect (.getBoundingClientRect el)]
    {:top (.-top rect)
     :left (.-left rect)
     :bottom (.-bottom rect)
     :right (.-right rect)
     :width (.-width rect)
     :height (.-height rect)
     :x (.-x rect)
     :y (.-y rect)}))

(defn clj-rect-observer [update!]
  (js/ResizeObserver.
    (fn [entries] 
      (when (.-contentRect (first (js->clj entries)))
        (update!)))))

(defn use-dom-bounding-client-rect
  ([el] (use-dom-bounding-client-rect el nil))
  ([el tick] 
   (let [[rect set-rect] (rum/use-state nil)]
     (rum/use-effect! 
       (if el 
         (fn [] 
           (let [update! #(set-rect (el->clj-rect el))
                 observer (clj-rect-observer update!)]
             (update!)
             (.observe observer el) 
             #(.disconnect observer)))
         #())
       [el tick])
     rect)))
          
(defn use-ref-bounding-client-rect 
  ([] (use-ref-bounding-client-rect nil))
  ([tick]
   (let [[ref set-ref] (rum/use-state nil)
         rect (use-dom-bounding-client-rect ref tick)]
     [set-ref rect ref]))
  ([ref tick] [nil (use-dom-bounding-client-rect ref tick)]))


(defn rem->px [rem]
  (-> js/document.documentElement
      js/getComputedStyle
      (.-fontSize)
      (js/parseFloat)
      (* rem)))

(defn px->rem [px]
  (->> js/document.documentElement
       js/getComputedStyle
       (.-fontSize)
       (js/parseFloat)
       (/ px)))
