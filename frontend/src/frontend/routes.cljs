(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.sidebar :as sidebar]))

(def routes
  [["/"
    {:name :home
     :view home/home
     ;; :view sidebar/sidebar
     }]

   ;; TODO: edit file
   ;; Settings
   ;; ["/item/:id"
   ;;  {:name ::item
   ;;   :view item-page
   ;;   :parameters {:path {:id int?}
   ;;                :query {(ds/opt :foo) keyword?}}}]
   ])
