(ns frontend.modules.layout.core
  (:require [cljs-bean.core :as bean]
            [frontend.util :as frontend-utils]))

(defonce *movable-containers (atom {}))

(defn- calc-layout-data
  [^js cnt ^js evt]
  (.toJSON (.getBoundingClientRect cnt)))

(defn ^:export move-container-to-top
  [identity]
  (when-let [^js/HTMLElement container (and (> (count @*movable-containers) 1)
                                            (get @*movable-containers identity))]
    (let [zdx (->> @*movable-containers
                   (map (fn [[_ ^js el]]
                          (let [^js c (js/getComputedStyle el)
                                v1 (.-visibility c)
                                v2 (.-display c)]
                            (when-let [z (and (= "visible" v1)
                                              (not= "none" v2)
                                              (.-zIndex c))]
                              z))))
                   (remove nil?))
          zdx (bean/->js zdx)
          zdx (and zdx (js/Math.max.apply nil zdx))]

      (set! (.. container -style -zIndex) (inc zdx)))))

(defn ^:export setup-draggable-container!
  [^js/HTMLElement el callback]
  (when-let [^js/HTMLElement handle (.querySelector el ".draggable-handle")]
    (let [^js cls (.-classList el)
          ^js ds (.-dataset el)
          identity (.-identity ds)
          ing? "is-dragging"]

      ;; draggable
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
                           (callback (bean/->js (calc-layout-data el e))))))
      ;; manager
      (swap! *movable-containers assoc identity el)

      #(swap! *movable-containers dissoc identity el))))

(defn ^:export setup-resizable-container!
  [^js/HTMLElement el callback]
  (let [^js cls (.-classList el)
        ^js ds (.-dataset el)
        identity (.-identity ds)
        ing? "is-resizing"]

    ;; resizable
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
                         (set! (.. el -style -height) (str h "px"))))}})))
    ;; manager
    (swap! *movable-containers assoc identity el)

    #(swap! *movable-containers dissoc identity el)))