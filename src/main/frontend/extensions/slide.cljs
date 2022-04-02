(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [medley.core :as medley]
            [cljs-bean.core :as bean]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.components.block :as block]
            [clojure.string :as string]
            [frontend.db-mixins :as db-mixins]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]))

(defn loaded? []
  js/window.Reveal)

(defn- with-properties
  [m block]
  (let [properties (:block/properties block)]
    (if (seq properties)
      (merge m
             (medley/map-keys
              (fn [k]
                (-> (str "data-" (name k))
                    (string/replace "data-data-" "data-")))
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
        has-children? (seq children)
        children (when (and has-children? (not deep-level?))
                   (map (fn [block]
                          (block-container config block (inc level))) children))
        block-el (block/block-container config (dissoc block :block/children))
        dom-attrs (with-properties {:key (str "slide-block-" (:block/uuid block))} block)]
    (if has-children?
      [:section dom-attrs
       [:section.relative
        block-el
        (when deep-level?
          [:span.opacity-30.text-xl "Hidden children"])]
       children]
      [:section dom-attrs block-el])))

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

(rum/defc slide < rum/reactive db-mixins/query
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
  [page-name]
  (let [loading? (rum/react *loading?)
        page (db/entity [:block/name page-name])
        journal? (:journal? page)
        repo (state/get-current-repo)
        blocks (-> (db/get-paginated-blocks repo (:db/id page))
                   (outliner-tree/blocks->vec-tree page-name))
        blocks (if journal?
                 (rest blocks)
                 blocks)
        config {:id          "slide-reveal-js"
                :slide?      true
                :sidebar?    true
                :page-name   page-name}]
    (slide-content loading? {:height 400} config blocks)))
