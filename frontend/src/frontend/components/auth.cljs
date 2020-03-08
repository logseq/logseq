(ns frontend.components.auth
  (:require [rum.core :as rum]))

(rum/defc auth
  [match]
  ;; trigger effect to get github access token using the `code` parameter
  (prn {:code (get-in match [:query-params :code])})
  (let [code (get-in match [:query-params :code])]
    [:div {:class "flex justify-center align-center"
          :style {:height "100%"}}
    [:div.loader.ease-linear.rounded-full.border-8.border-t-8.border-gray-200.h-64.w-64]]))
