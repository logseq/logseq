(ns frontend.extensions.tldraw
  (:require ["tldraw-logseq$App" :as tldraw-app]
            [frontend.components.page :refer [page]]
            [frontend.extensions.draw :as draw-common]
            [frontend.handler.draw :as draw-handler]
            [frontend.search :as search]
            [frontend.rum :as r]
            [frontend.state :as state]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def tldraw (r/adapt-class tldraw-app))

;; from apps/logseq/src/documents/dev.ts
(def dev-doc-model
  {:currentPageId "page1",
   :selectedIds [],
   :pages
   [{:name "Page",
     :id "page1",
     :shapes
     [{:id "logseq-portal-1",
       :type "logseq-portal",
       :parentId "page1",
       :point [100 100],
       :size [160 90],
       :pageId "asdfasdf"}],
     :bindings []}],
   :assets []})

(rum/defcs draw-inner < rum/reactive
  (rum/local false ::view-mode?)
  [state data option]
  (let [{:keys [file]} option]
    (when file
      [:div.overflow-hidden.draw
       {:style {:overscroll-behavior "none"}}
       [:div.draw-wrap.relative
        {:on-blur #(state/set-block-component-editing-mode! false)
         :style {:height "calc(100vh - 80px)" }}

        (tldraw {:PageComponent page
                 :searchHandler (comp clj->js vec search/page-search)
                 :onPersist (fn [app]
                              (let [document (gobj/get app "serialized")
                                    s (js/JSON.stringify document)]
                                (draw-handler/save-draw! file s)))
                 :model data})]])))

(rum/defc draw
  [option]
  (draw-common/draw-wrapper option draw-inner))
