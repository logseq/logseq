(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [medley.core :as medley]
            [cljs-bean.core :as bean]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.config :as config]))

(defn loaded? []
  js/window.Reveal)

(defn- with-properties
  [m block]
  (let [properties (:block/properties block)]
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
                :history false
                :center true
                :transition "slide"}))]
    (.initialize deck)))

(defn slide-content
  [loading? style sections]
  [:div
   [:p.text-sm
    [:span.opacity-70 "Tip: press "]
    [:code "F"]
    [:span.opacity-70 " to go fullscreen"]]
   [:div.reveal {:style style}
    (when loading?
      [:div.ls-center (ui/loading "")])
    [:div.slides
     (for [[idx sections] (medley/indexed sections)]
       (if (> (count sections) 1)       ; nested
         [:section {:key (str "slide-section-" idx)}
          (for [[idx2 [block block-cp]] (medley/indexed sections)]
            [:section (-> {:key (str "slide-section-" idx "-" idx2)}
                          (with-properties block))
             block-cp])]
         (let [[block block-cp] (first sections)]
           [:section (-> {:key (str "slide-section-" idx)}
                         (with-properties block))
            block-cp])))]]])

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
    (slide-content loading? {:height 400} sections)))
