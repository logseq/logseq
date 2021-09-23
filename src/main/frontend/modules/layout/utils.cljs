(ns frontend.modules.layout.utils
  (:require [cljs-bean.core :as bean]
            [frontend.util :as frontend-utils]))

(defn- calc-layout-data
  [^js cnt ^js evt]
  (.toJSON (.getBoundingClientRect cnt)))

(defn ^:export setup-draggable-container!
  [^js/HTMLElement el callback]
  (when-let [^js/HTMLElement handle (.querySelector el ".draggable-handle")]
    (let [^js cls (.-classList el)
          ing? "is-dragging"]
      (-> (js/interact handle)
          (.draggable
            (bean/->js
              {:listeners
               {:move (fn [^js/MouseEvent e]
                        (let [^js/HTMLElement target (.-target e)
                              ^js dset (.-dataset target)
                              dx (.-dx e)
                              dy (.-dy e)
                              dx' (frontend-utils/safe-parse-float (.-dx dset))
                              dy' (frontend-utils/safe-parse-float (.-dy dset))
                              x (+ dx (if dx' dx' 0))
                              y (+ dy (if dy' dy' 0))]

                          ;; update container position
                          (set! (.. el -style -transform) (str "translate(" x "px, " y "px)"))

                          ;; cache dx dy
                          (set! (.. target -dataset -dx) x)
                          (set! (.. target -dataset -dy) y)))}}))
          (.on "dragstart" (fn [] (.add cls ing?)))
          (.on "dragend" (fn [e]
                           (.remove cls ing?)
                           (callback (bean/->js (calc-layout-data el e)))))))))

(defn ^:export setup-resizable-container!
  [^js/HTMLElement el callback]
  (let [^js cls (.-classList el)
        ing? "is-resizing"]
    (-> (js/interact el)
        (.resizable
          (bean/->js
            {:edges
             {:left false :top false :bottom true :right true}

             :listeners
             {:start (fn [] (.add cls ing?))
              :end   (fn [e] (.remove cls ing?) (callback (bean/->js (calc-layout-data el e))))
              :move  (fn [^js/MouseEvent e]
                       (let [^js/HTMLElement target (.-target e)
                             w (.. e -rect -width)
                             h (.. e -rect -height)]

                         ;; update container size
                         (set! (.. el -style -width) (str w "px"))
                         (set! (.. el -style -height) (str h "px"))))}})))))