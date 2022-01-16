(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [medley.core :as medley]
            [cljs-bean.core :as bean]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.components.block :as block]))

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

;; reveal.js doesn't support multiple nested sections yet.
;; https://github.com/hakimel/reveal.js/issues/1440
(rum/defc block-container
  [config block level]
  (let [deep-level? (>= level 2)
        children (:block/children block)
        has-children? (seq children)]
    [:section (with-properties {:key (str "slide-block-" (:block/uuid block))} block)
     [:section.relative
      (block/block-container config (dissoc block :block/children))
      (when (and has-children? deep-level?)
        [:span.opacity-30.text-xl "Hidden children"])]
     (when (and has-children? (not deep-level?))
       (map (fn [block]
              (block-container config block (inc level))) children))]))

(defn slide-content
  [loading? style config blocks]
  [:div
   [:p.text-sm
    [:span.opacity-70 "Tip: press "]
    [:code "f"]
    [:span.opacity-70 " to go fullscreen"]]
   [:div.reveal {:style style}
    (when loading?
      [:div.ls-center (ui/loading "")])
    [:div.slides
     (map #(block-container config % 1) blocks)]]])

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
  [config blocks]
  (def blocks blocks)
  (let [loading? (rum/react *loading?)]
    (slide-content loading? {:height 400} config blocks)))
