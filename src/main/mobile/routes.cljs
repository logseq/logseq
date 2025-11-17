(ns mobile.routes
  (:require [frontend.components.page :as page]
            [mobile.components.left-sidebar :as mobile-left-sidebar]))

(def routes
  [["/"
    {:name :home}]
   ["/left-sidebar"
    {:name :left-sidebar
     :view (fn []
             (mobile-left-sidebar/left-sidebar))}]
   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (page/page-cp route-match))}]
   ["/graphs"
    {:name :graphs}]
   ["/import"
    {:name :import}]])
