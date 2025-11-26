(ns mobile.routes
  "Routes used in mobile app"
  (:require [frontend.components.page :as page]))

(def routes
  [["/"
    {:name :home}]
   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             [:div.mt-6
              (page/page-cp (assoc route-match :mobile-page? true))])}]
   ["/graphs"
    {:name :graphs}]
   ["/import"
    {:name :import}]])
