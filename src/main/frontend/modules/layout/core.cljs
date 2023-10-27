(ns frontend.modules.layout.core
  (:require [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.util :as util]))

(defonce *movable-containers (atom {}))

(defn- calc-layout-data
  [^js cnt ^js _evt]
  (let [^js o (.toJSON (.getBoundingClientRect cnt))]
    (set! (.-vw o) (gobj/get js/visualViewport "width"))
    (set! (.-vh o) (gobj/get js/visualViewport "height"))
    o))

(defn ^:export move-container-to-top
  [identity]
  (when-let [^js/HTMLElement container (and (> (count @*movable-containers) 1)
                                            (get @*movable-containers identity))]
    (let [zdx  (->> @*movable-containers
                    (map (fn [[_ ^js el]]
                           (let [^js c (js/getComputedStyle el)
                                 v1    (.-visibility c)
                                 v2    (.-display c)]
                             (when-let [z (and (= "visible" v1)
                                               (not= "none" v2)
                                               (.-zIndex c))]
                               z))))
                    (remove nil?))
          zdx  (bean/->js zdx)
          zdx  (and zdx (js/Math.max.apply nil zdx))
          zdx' (some-> (.. container -style -zIndex) (parse-long))]

      (when (or (nil? zdx') (not= zdx zdx'))
        (set! (.. container -style -zIndex) (inc zdx))))))

(defn ^:export setup-draggable-container!
  [^js/HTMLElement el callback]
  (when-let [^js/HTMLElement handle (.querySelector el ".draggable-handle")]
    (let [^js cls  (.-classList el)
          ^js ds   (.-dataset el)
          identity (.-identity ds)
          ing?     "is-dragging"]

      ;; draggable
      (-> (js/interact handle)
          (.draggable
           (bean/->js
            {:listeners
             {:move (fn [^js/MouseEvent e]
                      (let [^js dset (.-dataset el)
                            dx       (.-dx e)
                            dy       (.-dy e)
                            dx'      (.-dx dset)
                            dy'      (.-dy dset)
                            dx'      (and dx' (util/safe-parse-float dx'))
                            dy'      (and dy' (util/safe-parse-float dy'))
                            x        (+ dx (or dx' 0))
                            y        (+ dy (or dy' 0))]

                        ;; update container position
                        (set! (.. el -style -transform) (str "translate(" x "px, " y "px)"))

                        ;; cache dx dy
                        (set! (.. el -dataset -dx) x)
                        (set! (.. el -dataset -dy) y)))}}))
          (.on "dragstart" (fn [] (.add cls ing?)))
          (.on "dragend" (fn [e]
                           (.remove cls ing?)
                           (when (fn? callback)
                             (callback (bean/->js (calc-layout-data el e)))))))
      ;; manager
      (swap! *movable-containers assoc identity el)

      #(swap! *movable-containers dissoc identity el))))

(defn ^:export setup-resizable-container!
  [^js/HTMLElement el callback]
  (let [^js cls  (.-classList el)
        ^js ds   (.-dataset el)
        identity (.-identity ds)
        ing?     "is-resizing"]

    ;; resizable
    (-> (js/interact el)
        (.resizable
         (bean/->js
          {:edges
           {:left true :top true :bottom true :right true}

           :listeners
           {:start (fn [] (.add cls ing?))
            :end   (fn [e]
                     (.remove cls ing?)
                     (when (fn? callback)
                       (callback (bean/->js (calc-layout-data el e)))))
            :move  (fn [^js/MouseEvent e]
                     (let [^js dset (.-dataset el)
                           w        (.. e -rect -width)
                           h        (.. e -rect -height)

                           ;; update position from top/left
                           dx       (.. e -deltaRect -left)
                           dy       (.. e -deltaRect -top)

                           dx'      (.-dx dset)
                           dy'      (.-dy dset)
                           dx'      (and dx' (util/safe-parse-float dx'))
                           dy'      (and dy' (util/safe-parse-float dy'))

                           x        (+ dx (or dx' 0))
                           y        (+ dy (or dy' 0))]

                       ;; update container position
                       (set! (.. el -style -transform) (str "translate(" x "px, " y "px)"))

                       ;; update container size
                       (set! (.. el -style -width) (str w "px"))
                       (set! (.. el -style -height) (str h "px"))

                       (set! (. dset -dx) x)
                       (set! (. dset -dy) y)))}})))

    ;; manager
    (swap! *movable-containers assoc identity el)

    #(swap! *movable-containers dissoc identity el)))
