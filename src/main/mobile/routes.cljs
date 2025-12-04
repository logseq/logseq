(ns mobile.routes
  "Routes used in mobile app"
  (:require [frontend.components.export :as export]
            [frontend.components.imports :as imports]
            [frontend.components.page :as page]))

(def routes
  [["/"
    {:name :home}]
   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             [:div.ls-mobile-page.pt-10
              (page/page-cp (assoc route-match :mobile-page? true))])}]
   ["/import"
    {:name :import
     :view (fn []
             (imports/importer {}))}]
   ["/export"
    {:name :export
     :view (fn []
             [:div.mt-8
              (export/export)])}]])
