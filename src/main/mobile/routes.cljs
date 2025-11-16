(ns mobile.routes
  (:require [frontend.components.page :as page]
            [mobile.components.left-sidebar :as mobile-left-sidebar]
            [mobile.components.search :as search]))

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
   ["/search"
    {:name :search
     :view (fn []
             (search/search))}]
   ["/graphs"
    {:name :graphs}]
   ["/import"
    {:name :import}]])
