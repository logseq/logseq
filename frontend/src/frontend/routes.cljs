(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.auth :as auth]))

(def routes
  [["/"
    {:name :home
     ;; :view home/home
     :view sidebar/sidebar
     }]
   ["/auth/github"
    {:name :github-auth
     :view auth/auth}]

   ;; TODO: edit file
   ;; Settings
   ;; ["/item/:id"
   ;;  {:name ::item
   ;;   :view item-page
   ;;   :parameters {:path {:id int?}
   ;;                :query {(ds/opt :foo) keyword?}}}]
   ])
