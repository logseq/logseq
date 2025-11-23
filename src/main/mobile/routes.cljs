(ns mobile.routes
  (:require [frontend.components.page :as page]))

(def routes
  [["/"
    {:name :home}]
   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (page/page-cp route-match))}]
   ["/graphs"
    {:name :graphs}]
   ["/import"
    {:name :import}]])
