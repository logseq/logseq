(ns frontend.components.whiteboard
  (:require [frontend.components.page :as page]
            [frontend.db.model :as model]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]
            [shadow.loader :as loader]))

(defonce tldraw-loaded? (atom false))
(rum/defc tldraw-app < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [name]
  (let [loaded? (rum/react tldraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.tldraw/tldraw-app))]
    (when draw-component
      (draw-component name))))

(defn- get-whiteboard-name-from-route
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(rum/defc dashboard-card
  [page-name]
  [:a.border.p-4.rounded.text-xl
   {:key page-name
    :on-mouse-down
    (fn [e]
      (util/stop e)
      (route-handler/redirect-to-whiteboard! page-name))} page-name])

(rum/defc whiteboard-dashboard
  []
  (let [whiteboard-names (model/get-all-whiteboard-names (state/get-current-repo))]
    [:div.p-4
     (ui/button "Create new whiteboard"
                :small? true
                :on-click (fn [e]
                            (util/stop e)
                            (route-handler/redirect-to-whiteboard! "new whiteboard")))
     [:div.flex.flex-col.gap-4.py-2
      (for [whiteboard-name whiteboard-names]
        (dashboard-card whiteboard-name))]]))

(rum/defcs whiteboard < rum/reactive
  [state]
  (let [name (get-whiteboard-name-from-route state)]
    [:div.absolute.w-full.h-full

     ;; makes sure the whiteboard will not cover the borders
     {:key name
      :style {:padding "0.5px" :z-index 0}}

     [:span.inline-flex.absolute.color-level.m-2.px-2
      {:key name
       :style {:z-index 2000}}
      
      (page/page-title name
                       [:span.text-gray-500.ti.ti-artboard
                        {:style {:vertical-align "middle" :font-size "0.9em"}}]
                       name nil false)]

     (tldraw-app name)]))
