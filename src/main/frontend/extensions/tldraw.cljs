(ns frontend.extensions.tldraw
  (:require ["tldraw-logseq" :as TldrawLogseq]
            [frontend.components.page :refer [page]]
            [frontend.extensions.draw :as draw-common]
            [frontend.handler.draw :as draw-handler]
            [frontend.search :as search]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def tldraw (r/adapt-class (gobj/get TldrawLogseq "App")))

(rum/defcs draw-inner < rum/reactive
  (rum/local false ::view-mode?)
  {:init (fn [state]
           (assoc state ::id (random-uuid)))
   :will-unmount (fn [state]
                   (state/update-state! :ui/whiteboards
                                        (fn [m]
                                          (dissoc m (::id state))))
                   state)}
  [state data option]
  (let [{:keys [file]} option]
    (when file
      [:div.overflow-hidden.draw.tldraw
       {:style {:overscroll-behavior "none"}}
       [:div.draw-wrap.relative
        {:on-blur #(state/set-block-component-editing-mode! false)
         :on-wheel util/stop-propagation ;; wheel -> overscroll may cause browser navigation
         :style {:height "calc(100vh - 80px)"}}

        (tldraw {:PageComponent page
                 :searchHandler (comp clj->js vec search/page-search)
                 :onPersist (fn [app]
                              (let [document (gobj/get app "serialized")
                                    s (js/JSON.stringify document)]
                                (draw-handler/save-draw! file s)))
                 :model data
                 :onApp (fn [app]
                          (state/set-state! [:ui/whiteboards (::id state)] app))})]])))

(rum/defc tldraw-app
  [option]
  (draw-common/draw-wrapper option draw-inner))
