(ns frontend.extensions.slide
  (:require [rum.core :as rum]
            [cljs-bean.core :as bean]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.context.i18n :refer [t]]
            [frontend.config :as config]
            [frontend.components.block :as block]
            [clojure.string :as string]
            [frontend.db-mixins :as db-mixins]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.handler.db-based.property.util :as db-pu]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [frontend.db.conn :as conn]))

(defn loaded? []
  js/window.Reveal)

(defn- with-properties
  [m block]
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)
        properties (if db-based?
                     (as-> (db-property/properties block) properties
                       (->> properties
                            (keep (fn [[k v]]
                                    ;; Don't inject hidden props like created-from-property
                                    (when-not (:hide? (:block/schema (db/entity repo k)))
                                      [k
                                       (if (:db/id v)
                                         ;; Can't use db-property-util/lookup b/c vals aren't entities
                                         (db-property/ref->property-value-content (conn/get-db) v)
                                         v)])))
                            (into {})))
                     (:block/properties block))]
    (if (seq properties)
      (merge m
             (update-keys
              properties
              (fn [k]
                (-> (str "data-" (if db-based? (db-pu/get-property-name k) (name k)))
                    (string/replace "data-data-" "data-")))))
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
                :transition "slide"
                :keyboardCondition "focused"}))]
    (.initialize deck)))

;; reveal.js doesn't support multiple nested sections yet.
;; https://github.com/hakimel/reveal.js/issues/1440
(rum/defc block-container
  [config block level]
  (let [children (:block/children block)
        has-children? (seq children)
        children (when has-children?
                   (map (fn [block]
                          (block-container config block (inc level))) children))
        block-el (block/block-container config (dissoc block :block/children))
        dom-attrs (with-properties {:key (str "slide-block-" (:block/uuid block))} block)]
    (if has-children?
      [:section dom-attrs
       [:section.relative
        block-el]
       children]
      [:section dom-attrs block-el])))

(defn slide-content
  [loading? style config blocks]
  [:div
   [:p.text-sm
    (t :page/slide-view-tip-go-fullscreen)]
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
                     (config/asset-uri (if config/publishing? "static/js/reveal.js" "/static/js/reveal.js"))
                     (fn []
                       (reset! *loading? false)
                       (render!)))))
                state)}
  [page]
  (let [page-name (:block/title page)
        loading? (rum/react *loading?)
        journal? (ldb/journal? page)
        repo (state/get-current-repo)
        blocks (-> (db/get-page-blocks-no-cache repo (:db/id page))
                   (outliner-tree/blocks->vec-tree (:db/id page)))
        blocks (if (and journal? (not (config/db-based-graph? repo)))
                 (rest blocks)
                 blocks)
        blocks (map (fn [block]
                      (update block :block/children
                              (fn [children]
                                (->>
                                 (mapcat
                                  (fn [x]
                                    (tree-seq map? :block/children x))
                                  children)
                                 (map #(dissoc % :block/children)))))) blocks)
        config {:id          "slide-reveal-js"
                :slide?      true
                :sidebar?    true
                :page-name   page-name}]
    (slide-content loading? {:height 400} config blocks)))
