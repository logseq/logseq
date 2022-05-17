(ns frontend.components.whiteboard
  (:require [frontend.handler.route :as route-handler]
            [shadow.loader :as loader]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce tldraw-loaded? (atom false))
(rum/defc tldraw-app < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [option]
  (let [loaded? (rum/react tldraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.tldraw/tldraw-app))]
    (when draw-component
      (draw-component option))))

(defn- get-whiteboard-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(rum/defc whiteboard-dashboard
  []
  ;; Placeholder
  [:a {:on-mouse-down
       (fn [e]
         (util/stop e)
         (route-handler/redirect-to-whiteboard! "test"))} "test"])

(rum/defcs whiteboard < rum/reactive
  [state]
  (let [name (get-whiteboard-name state)
        tldr-name (str "draws/" name ".tldr")]
    [:div.absolute.w-full.h-full
     ;; makes sure the whiteboard will not cover the borders
     {:style {:padding "0.5px"}}
     (tldraw-app {:file tldr-name})]))
