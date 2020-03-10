(ns frontend.components.auth
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.mixins :as mixins]))

(rum/defcs auth <
  (mixins/will-mount-effect
   (fn [args]
     (let [code (get-in (first args) [:query-params :code])]
       (when code
         (handler/get-github-access-token code)))))
  [state match]
  [:div {:class "flex justify-center align-center"
         :style {:height "100%"}}
   [:div.loader.ease-linear.rounded-full.border-8.border-t-8.border-gray-200.h-64.w-64]])
