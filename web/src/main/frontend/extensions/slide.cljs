(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [medley.core :as medley]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defn loaded? []
  js/window.Reveal)

(defn- with-properties
  [m heading]
  (let [properties (:heading/properties heading)]
    (if (seq properties)
      (merge m
             (medley/map-keys
              (fn [k]
                (str "data-" k))
              properties))
      m)))

(rum/defc slide < rum/reactive
  {:did-mount (fn [state]
                (when (loaded?)
                  (let [deck (js/window.Reveal.
                              (js/document.querySelector ".reveal")
                              (bean/->js
                               {:embedded true
                                :controls true
                                :history true
                                :center true
                                :transition "slide"}))]
                    (.initialize deck)))
                state)}
  [sections]
  [:div.reveal {:style {:height 400}}
   [:div.slides
    (for [[idx sections] (medley/indexed sections)]
      (if (> (count sections) 1)       ; nested
        [:section {:key (str "slide-section-" idx)}
         (for [[idx2 [heading heading-cp]] (medley/indexed sections)]
           [:section (-> {:key (str "slide-section-" idx "-" idx2)}
                         (with-properties heading))
            heading-cp])]
        (let [[heading heading-cp] (first sections)]
          [:section (-> {:key (str "slide-section-" idx)}
                        (with-properties heading))
           heading-cp])))]])
