(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [medley.core :as medley]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.components.widgets :as widgets]
            [frontend.loader :as loader]
            [frontend.config :as config]))

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

(defonce *loading? (atom false))

(defn render!
  []
  (let [deck (js/window.Reveal.
              (js/document.querySelector ".reveal")
              (bean/->js
               {:embedded true
                :controls true
                :history true
                :center true
                :transition "slide"}))]
    (.initialize deck)))

(rum/defc slide < rum/reactive
  {:did-mount (fn [state]
                (if (loaded?)
                  (do
                    (reset! *loading? false)
                    (render!))
                  (do
                    (reset! *loading? true)
                    (loader/load
                     (config/asset-uri "/static/js/reveal.min.js")
                     (fn []
                       (reset! *loading? false)
                       (render!)))))
                state)}
  [sections]
  (let [loading? (rum/react *loading?)]
    [:div.reveal {:style {:height 400}}
     (when loading?
       [:div.ls-center (widgets/loading "")])
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
             heading-cp])))]]))
