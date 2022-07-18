(ns frontend.components.whiteboard
  (:require [frontend.components.page :as page]
            [frontend.handler.route :as route-handler]
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

(defn- get-whiteboard-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(rum/defc dashboard-card
  [page-name]
  [:a {:on-mouse-down
       (fn [e]
         (util/stop e)
         (route-handler/redirect-to-whiteboard! page-name))} page-name])

;; (rum/defc dashboard-grid
;;           )

(rum/defc whiteboard-dashboard
  []
  ;; Placeholder
  [:a {:on-mouse-down
       (fn [e]
         (util/stop e)
         (route-handler/redirect-to-whiteboard! "test"))} "test"])

(rum/defcs whiteboard < rum/reactive
  [state]
  (let [name (get-whiteboard-name state)]
    [:div.absolute.w-full.h-full

     ;; makes sure the whiteboard will not cover the borders
     {:key name
      :style {:padding "0.5px" :z-index 0}}

     [:span.inline-flex.absolute
      {:key name
       :style {:z-index 2000}}
      (page/page-title name nil name nil false)]

     (tldraw-app name)]))
